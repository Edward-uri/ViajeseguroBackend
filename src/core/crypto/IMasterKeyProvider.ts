export interface IMasterKeyProvider {
  readonly nombre: 'env' | 'aws-kms';
  generarDataKey(): Promise<{ plaintext: Buffer; cifrada: Buffer }>;
  descifrarDataKey(cifrada: Buffer): Promise<Buffer>;
}
