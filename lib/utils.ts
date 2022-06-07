export function sh(cmd: string) {
  return async () => {
    console.log("[Step]", ["bash", "-c", cmd]);
    const p = await Deno.run({
      cmd: ["bash", "-c", cmd],
      stdin: "inherit",
      stdout: "inherit",
      stderr: "inherit",
    });
    const status = await p.status();
    if (!status.success) {
      throw new Error("[sh] cmd returned: " + status.code);
    }
    return status;
  };
}
