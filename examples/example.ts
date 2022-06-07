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
// console.log(container.dockerfile())