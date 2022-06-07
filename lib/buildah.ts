import {
	Copy,
	Env,
	isCopy,
	isEnv,
	isRun,
	isUser,
	Run,
	Step,
	Steps,
	User,
	WorkDir,
	isWorkDir,
} from "./commands.ts";
import { sh } from "./utils.ts";

interface ContainerSpec {
	steps?: Steps;
	from?: string;
	port?: number;
	entrypoint?: Array<string>;
	cmd?: Array<string>;
	author?: string;
	labels?: {
		"org.opencontainers.image.authors"?: Array<string>;
		version?: string;
		description?: string;
	};
	volumes?: Array<string>;
}

const containerDefault: ContainerSpec = {
	steps: [],
	volumes: [],
};

interface Result {
	success: boolean;
}

export class Container {
	name: string;
	spec: ContainerSpec;

	constructor(spec?: ContainerSpec) {
		this.name = crypto.randomUUID().toString().slice(0, 8);
		this.spec = {
			...containerDefault,
			...spec,
		};
	}

	FROM(image: string): Container {
		this.spec.from = image;
		return this;
	}

	RUN(cmd: string): Container {
		this.spec.steps?.push({
			type: "run",
			cmd,
		});
		return this;
	}
	ENV(name: string, value: string): Container {
		this.spec.steps?.push({
			type: "env",
			name: name.trim(),
			value: value.trim(),
		});
		return this;
	}

	CMD(...cmd: Array<string | Array<string>>) {
		this.spec.cmd = cmd.flat();
		return this;
	}

	ENTRYPOINT(...cmd: Array<string | Array<string>>) {
		this.spec.entrypoint = cmd.flat();
		return this;
	}

	COPY(src: string, dest: string): Container {
		if (!dest.startsWith("/")) {
			throw new Error("destination path should be absolute: " + dest)
		}
		this.spec.steps?.push({
			type: "copy",
			src,
			dest,
		});
		return this;
	}

	USER(id: string): Container {
		this.spec.steps?.push({
			type: "user",
			id,
		});
		return this;
	}
	WORKDIR(dir: string): Container {
		this.spec.steps?.push({
			type: "workdir",
			dir,
		});
		return this;
	}

	VOLUME(volume: string): Container {
		this.spec.volumes?.push(volume);
		return this;
	}

	AUTHOR(author: string): Container {
		this.spec.author = author;
		return this;
	}

	script(imageName: string) {
		const steps = [
			`buildah from --name ${this.name} ${this.spec.from}`,
		];
		for (const step of this.spec.steps ?? []) {
			if (isRun(step)) {
				steps.push(`buildah run ${this.name} ${step.cmd}`);
			} else if (isEnv(step)) {
				steps.push(
					`buildah config --env ${step.name}=${step.value} ${this.name}`,
				);
			} else if (isUser(step)) {
				steps.push(`buildah config --user ${step.id} ${this.name}`);
			} else if (isCopy(step)) {
				steps.push(
					`export MNT=$(buildah mount ${this.name}) && cp -r ${step.src} $MNT/${step.dest}`,
				);
			} else if (isWorkDir(step)) {
				steps.push(
					`buildah config --workingdir ${step.dir} ${this.name}`,
				);
			}
		}

		if (this.spec.port) {
			steps.push(`buildah config --port ${this.spec.port} ${this.name}`);
		}

		if (this.spec.entrypoint) {
			const json = JSON.stringify(this.spec.entrypoint);
			steps.push(`buildah config --entrypoint '${json}' ${this.name}`);
		}

		if (this.spec.volumes) {
			const json = JSON.stringify(this.spec.volumes);
			this.spec.volumes.forEach((volume) => {
				steps.push(`buildah config --volume '${volume}' ${this.name}`);
			});
		}

		if (this.spec.cmd) {
			const json = JSON.stringify(this.spec.cmd);
			steps.push(`buildah config --cmd '${json}' ${this.name}`);
		}

		if (this.spec.author) {
			const json = JSON.stringify(this.spec.author);
			steps.push(`buildah config --author ${json} ${this.name}`);
		}

		steps.push(`buildah commit ${this.name} ${imageName}`);
		return steps;
	}

	dockerfile() {
		const steps = [
			`FROM ${this.spec.from}`,
		];

		for (const step of this.spec.steps ?? []) {
			if (isRun(step)) {
				steps.push(`RUN ${step.cmd}`);
			} else if (isEnv(step)) {
				steps.push(`ENV ${step.name}=${step.value}`);
			} else if (isUser(step)) {
				steps.push(`USER ${step.id}`);
			} else if (isCopy(step)) {
				steps.push(`COPY ${step.src} ${step.dest}`);
			} else if (isWorkDir(step)) {
				steps.push(`WORKDIR ${step.dir}`);
			}
		}

		if (this.spec.port) {
			steps.push(`EXPOSE ${this.spec.port}`);
		}

		if (this.spec.entrypoint) {
			const json = JSON.stringify(this.spec.entrypoint);
			steps.push(`CMD ${json}`);
		}

		if (this.spec.volumes) {
			const json = JSON.stringify(this.spec.volumes);
			steps.push(`VOLUME ${json}`);
		}

		if (this.spec.cmd) {
			const json = JSON.stringify(this.spec.cmd);
			steps.push(`CMD ${json}`);
		}

		if (this.spec.author) {
			const json = JSON.stringify(this.spec.author);
			steps.push(`LABEL author=${json}`);
		}

		if (this.spec.labels) {
			const json = JSON.stringify(this.spec.author);
			steps.push(`LABEL author=${json}`);
		}

		return steps.join("\n");
	}

	async build(containerName: string) {
		const script = this.script(containerName);
		for (const step of script) {
			const { success } = await sh(step)();
			if (!success) {
				console.error(`Error running step: ${step}`);
			}
		}
	}
}
