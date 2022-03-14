import wave

with wave.open('empty.wav', 'wb') as fp:
  fp.setnchannels(1)
  fp.setsampwidth(2)
  fp.setframerate(44100)
  fp.writeframesraw(b'\0' * 44100 * 2)
