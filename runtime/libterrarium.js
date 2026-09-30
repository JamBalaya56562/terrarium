// terrarium's additions to Emscripten's JavaScript runtime: system calls the
// target tools make that Emscripten leaves unimplemented. Emscripten defines
// those as weak C stubs, so syscalls.c overrides each one and calls in here.

addToLibrary({
  // socketpair(2) for AF_UNIX: two PIPEFS pipes crossed over, so each end
  // reads from one pipe and writes to the other. tokio's signal driver and
  // other self-pipe wakers need nothing more than a byte stream each way.
  terrarium_socketpair__deps: ['$PIPEFS', '$FS'],
  terrarium_socketpair__proxy: 'sync',
  terrarium_socketpair: (domain, type, protocol, sv) => {
    var AF_UNIX = 1;
    var SOCK_NONBLOCK = {{{ cDefs.O_NONBLOCK }}};
    if (domain != AF_UNIX) {
      return -{{{ cDefs.EAFNOSUPPORT }}};
    }
    var nonblock = type & SOCK_NONBLOCK;
    var aToB = PIPEFS.createPipe();
    var bToA = PIPEFS.createPipe();

    var end = (readFd, writeFd) => {
      var rs = FS.getStream(readFd);
      var ws = FS.getStream(writeFd);
      FS.closeStream(readFd);
      FS.closeStream(writeFd);
      var ops = PIPEFS.stream_ops;
      var syncNonblock = (stream, inner) => {
        inner.flags = (inner.flags & ~SOCK_NONBLOCK) | (stream.flags & SOCK_NONBLOCK);
      };
      return FS.createStream({
        path: 'socketpair',
        node: rs.node,
        flags: {{{ cDefs.O_RDWR }}} | nonblock,
        seekable: false,
        stream_ops: {
          getattr: (stream) => ops.getattr(rs),
          read: (stream, ...args) => {
            syncNonblock(stream, rs);
            return ops.read(rs, ...args);
          },
          write: (stream, ...args) => {
            syncNonblock(stream, ws);
            return ops.write(ws, ...args);
          },
          poll: (stream, ...args) => {
            var out = {{{ cDefs.POLLOUT }}} | {{{ cDefs.POLLWRNORM }}} | {{{ cDefs.POLLERR }}};
            return (ops.poll(rs, ...args) & ~out) | (ops.poll(ws, ...args) & out);
          },
          ioctl: (stream, ...args) => ops.ioctl(rs, ...args),
          dup: (stream) => {
            ops.dup(rs);
            ops.dup(ws);
          },
          close: (stream) => {
            ops.close(rs);
            ops.close(ws);
          },
        },
      });
    };

    var first = end(aToB.readable_fd, bToA.writable_fd);
    var second = end(bToA.readable_fd, aToB.writable_fd);
    {{{ makeSetValue('sv', 0, 'first.fd', 'i32') }}};
    {{{ makeSetValue('sv', 4, 'second.fd', 'i32') }}};
    return 0;
  },

  // Hard links for MEMFS, which has none: FS.link() fails with EMLINK unless the
  // parent directory has a `link` node op. MEMFS finds nodes only through FS's
  // name table, keyed by each node's single parent and name, so a second name
  // for the same node is kept in the directory's `contents` and found through a
  // `lookup` fallback. Known gap: renaming the second name moves the first.
  $TERRARIUM_HARDLINKS__deps: ['$FS', '$MEMFS', '$addOnPreRun'],
  $TERRARIUM_HARDLINKS__postset: () => 'addOnPreRun(TERRARIUM_HARDLINKS);',
  $TERRARIUM_HARDLINKS: () => {
    if (!MEMFS.ops_table) {
      MEMFS.createNode(null, '/', {{{ cDefs.S_IFDIR }}} | 0o777, 0);
    }
    var AT_SYMLINK_FOLLOW = 0x400;
    var dir = MEMFS.ops_table.dir.node;
    var file = MEMFS.ops_table.file.node;

    var lookup = dir.lookup;
    dir.lookup = (parent, name) => parent.contents[name] ?? lookup(parent, name);

    dir.link = (parent, newname, oldpath, flags) => {
      var target = FS.lookupPath(oldpath, { follow: !!(flags & AT_SYMLINK_FOLLOW) }).node;
      if (FS.isDir(target.mode)) {
        throw new FS.ErrnoError({{{ cDefs.EPERM }}});
      }
      parent.contents[newname] = target;
      target.terrariumNlink = (target.terrariumNlink ?? 1) + 1;
      parent.ctime = parent.mtime = Date.now();
    };

    var unlink = dir.unlink;
    dir.unlink = (parent, name) => {
      var node = parent.contents[name];
      if (node?.terrariumNlink > 1) {
        node.terrariumNlink--;
      }
      unlink(parent, name);
    };

    var getattr = file.getattr;
    file.getattr = (node) => {
      var attr = getattr(node);
      attr.nlink = node.terrariumNlink ?? attr.nlink;
      return attr;
    };
  },
});
