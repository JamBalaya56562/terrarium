# Latest locked crate compatibility

Remote CI run 37721681248 successfully resolved v2.30.1, then failed compiling unpatched mio 1.2.4. Latest source also locks libc 0.2.190 and tokio 1.53.2; existing exact-version patches did not select these versions.

Added the existing Emscripten adaptations for those three exact versions. Downloaded upstream archives from static.crates.io; all hunks apply with forward dry-run. Original patches remain for older tools. Actual compilation and latest CLI behavior are checked by the next remote CI. The failed run is preserved as failure evidence.
