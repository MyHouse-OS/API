# BunServer

To install dependencies:

```bash
bun install
```

To install Lefthook git hooks:

```bash
bunx lefthook install
```

To run:

```bash
bun run start
```

Or with Docker:

```bash
docker compose up --build
```

To run knip to check for unused dependencies:

```bash
bun knip
```

To format code:

```bash
bun format
```

To lint code:

```bash
bun lint
```

To check code:

```bash
bun check
```

This project was created using `bun init` in bun v1.3.4. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
