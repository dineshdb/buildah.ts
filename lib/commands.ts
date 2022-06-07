export interface Run {
  type: "run";
  cmd: string;
}

export interface Copy {
  type: "copy";
  src: string;
  dest?: string;
}

export interface Env {
  type: "env";
  name: string;
  value: string;
}

export interface User {
  type: "user";
  id: string;
}

export interface WorkDir {
  type: "workdir";
  dir: string;
}

export type Step = (Run | Copy | Env | User | WorkDir);
export type Steps = Array<Step>;

export const isRun = (s: Step): s is Run => s.type === "run";
export const isCopy = (s: Step): s is Copy => s.type === "copy";
export const isEnv = (s: Step): s is Env => s.type === "env";
export const isUser = (s: Step): s is User => s.type === "user";
export const isWorkDir = (s: Step): s is WorkDir => s.type === "workdir";
