// Strong definitions for system calls Emscripten only stubs out weakly. Each
// forwards to its implementation in libterrarium.js.

int terrarium_socketpair(int domain, int type, int protocol, int fds[2]);

int __syscall_socketpair(int domain, int type, int protocol, int fds[2], int unused1, int unused2) {
  return terrarium_socketpair(domain, type, protocol, fds);
}
