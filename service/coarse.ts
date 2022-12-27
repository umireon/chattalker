export function coarseIntoUint8Array(data: Uint8Array | string): Uint8Array {
  if (typeof data === "string") {
    const encoder = new TextEncoder();
    return encoder.encode(data);
  } else {
    return data;
  }
}

export function coarseIntoString(data: Uint8Array | string): string {
  if (typeof data === "string") {
    return data;
  } else {
    const decoder = new TextDecoder();
    return decoder.decode(data);
  }
}
