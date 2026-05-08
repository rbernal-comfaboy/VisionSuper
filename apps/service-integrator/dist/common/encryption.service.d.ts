export declare class EncryptionService {
    private readonly algorithm;
    private readonly key;
    encrypt(text: string): string;
    decrypt(encryptedText: string): string;
}
