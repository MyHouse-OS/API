import { describe, expect, it } from "bun:test";
import { decrypt, encrypt } from "../../src/utils/crypto";

describe("Crypto Utils", () => {
	it("should encrypt and decrypt a string correctly", () => {
		const originalText = "Hello World!";
		const encrypted = encrypt(originalText);

		expect(encrypted).not.toBe(originalText);
		expect(encrypted).toContain(":");

		const decrypted = decrypt(encrypted);
		expect(decrypted).toBe(originalText);
	});

	it("should produce different ciphertexts for the same input (due to random IV)", () => {
		const text = "Consistent Text";
		const encrypted1 = encrypt(text);
		const encrypted2 = encrypt(text);

		expect(encrypted1).not.toBe(encrypted2);
	});

	it("should handle empty strings", () => {
		const text = "";
		const encrypted = encrypt(text);
		const decrypted = decrypt(encrypted);
		expect(decrypted).toBe(text);
	});

	it("should throw error when decrypting invalid format", () => {
		const _invalidInput = "not-a-hex-iv:not-hex-data";
		expect(() => decrypt("invaliddata")).toThrow();
	});
});
