import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";

const PASSWORD = process.env.ENCRYPTION_KEY || "MySuperSecretPasswordFixed123!";
const SALT = "MyFixedSalt";
const KEY = scryptSync(PASSWORD, SALT, 32);
const IV_LENGTH = 16;

export const encrypt = (text: string): string => {
	const iv = randomBytes(IV_LENGTH);
	const cipher = createCipheriv("aes-256-ctr", KEY, iv);
	let encrypted = cipher.update(text);
	encrypted = Buffer.concat([encrypted, cipher.final()]);
	return `${iv.toString("hex")}:${encrypted.toString("hex")}`;
};

export const decrypt = (text: string): string => {
	const textParts = text.split(":");
	const ivHex = textParts.shift();
	if (!ivHex) throw new Error("Invalid encrypted text format: missing IV");
	const iv = Buffer.from(ivHex, "hex");
	const encryptedText = Buffer.from(textParts.join(":"), "hex");
	const decipher = createDecipheriv("aes-256-ctr", KEY, iv);
	let decrypted = decipher.update(encryptedText);
	decrypted = Buffer.concat([decrypted, decipher.final()]);
	return decrypted.toString();
};
