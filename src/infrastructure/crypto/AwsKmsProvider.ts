import { KMSClient, GenerateDataKeyCommand, DecryptCommand } from '@aws-sdk/client-kms';
import type { IMasterKeyProvider } from '../../core/crypto/IMasterKeyProvider.js';
import { CipherError } from '../../core/errors.js';


export class AwsKmsProvider implements IMasterKeyProvider {
  readonly nombre = 'aws-kms' as const;
  private readonly kms = new KMSClient({});

  constructor(private readonly keyId: string) {}

  async generarDataKey(): Promise<{ plaintext: Buffer; cifrada: Buffer }> {
    const out = await this.kms.send(new GenerateDataKeyCommand({ KeyId: this.keyId, KeySpec: 'AES_256' }));
    if (!out.Plaintext || !out.CiphertextBlob) throw new CipherError('KMS no devolvió la data-key');
    return { plaintext: Buffer.from(out.Plaintext), cifrada: Buffer.from(out.CiphertextBlob) };
  }

  async descifrarDataKey(cifrada: Buffer): Promise<Buffer> {
    const out = await this.kms.send(new DecryptCommand({ CiphertextBlob: cifrada, KeyId: this.keyId }));
    if (!out.Plaintext) throw new CipherError('KMS no pudo descifrar la data-key');
    return Buffer.from(out.Plaintext);
  }
}
