# Readme

#buildah #docker #dsl #typescript #type-save #deno

This is a simple type safe wrapper around buildah. You can write your dockerfile in typescript and this will generate 
dockerfile or a shell script using buildah. Using buildah has the benefit of adding a single layer in the image making
your script far cleaner.

## Dependencies

- deno
- buildah

## Getting started

```typescript
#!/usr/bin/env -S deno run --unstable --allow-env --allow-read --allow-write --allow-run
import { Container } from "../mod.ts";

const container = new Container()
  .FROM("docker.io/ubuntu")
  .AUTHOR("Dinesh Bhattarai")
  .RUN("echo 'hello'")
  .RUN("mkdir -p /app")
  .WORKDIR("/app")
  .ENV("test", "value")
  .COPY("mod.ts", "/app")
  .USER("1000:1000")
  .VOLUME("/var/lib/docker")
  .CMD("bash")
  .ENTRYPOINT("bash", "-c")
  ;

await container.build("docker.io/dineshdb/test");

// or you can generate a dockerfile commands. Will on the screen(stdout).
container.dockerfile()
```

See [examples](examples/) for more info.

## License

SPDX-License-Identifier: MIT
SPDX-License-Identifier: Apache