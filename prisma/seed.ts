import { encrypt } from "../src/utils/crypto";
import { prisma } from "./db";

async function main() {
	console.log("🌱 Starting seeding...");

	await prisma.homeState.deleteMany({
		where: {
			id: { not: 1 },
		},
	});

	const homeState = await prisma.homeState.upsert({
		where: { id: 1 },
		update: {},
		create: {
			id: 1,
			temperature: "20",
			light: false,
			door: false,
			heat: false,
		},
	});
	console.log("🏠 Home State initialized:", homeState);

	const encryptedToken = encrypt("master");
	await prisma.client.upsert({
		where: { ClientID: "master" },
		update: { ClientToken: encryptedToken },
		create: {
			ClientID: "master",
			ClientToken: encryptedToken,
		},
	});
	console.log("🤖 Master Client initialized (id: master)");

	const passwordHash = await Bun.password.hash("root");
	await prisma.user.upsert({
		where: { username: "root" },
		update: { password: passwordHash },
		create: {
			username: "root",
			password: passwordHash,
		},
	});
	console.log("👤 Root User initialized (user: root)");

	const passwordHashForDashboard = encrypt("root");
	await prisma.client.upsert({
		where: { ClientID: "root" },
		update: { ClientToken: passwordHashForDashboard },
		create: {
			ClientID: "root",
			ClientToken: passwordHashForDashboard,
		},
	});
	console.log("👤 Root Client initialized (client: root)");

	console.log("✅ Seeding completed.");
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
