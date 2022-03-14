import React from 'react'

export const VoiceForm: React.VFC = () => (
  <form>
    <p>
      <label htmlFor="voice-en">en</label>
      <select name="voice[en]" id="voice-en">
        <option value="en-US-Wavenet-A">en-US-Wavenet-A Male</option>
        <option value="en-US-Wavenet-B">en-US-Wavenet-B Male</option>
        <option value="en-US-Wavenet-C">en-US-Wavenet-C Female</option>
        <option value="en-US-Wavenet-D">en-US-Wavenet-D Male</option>
        <option value="en-US-Wavenet-E">en-US-Wavenet-E Female</option>
        <option value="en-US-Wavenet-F">en-US-Wavenet-F Female</option>
        <option value="en-US-Wavenet-G">en-US-Wavenet-G Female</option>
        <option value="en-US-Wavenet-H">en-US-Wavenet-H Female</option>
        <option value="en-US-Wavenet-I">en-US-Wavenet-I Male</option>
        <option value="en-US-Wavenet-J">en-US-Wavenet-J Male</option>
        <option value="en-GB-Wavenet-A">en-GB-Wavenet-A Female</option>
        <option value="en-GB-Wavenet-B">en-GB-Wavenet-B Male</option>
        <option value="en-GB-Wavenet-C">en-GB-Wavenet-C Female</option>
        <option value="en-GB-Wavenet-D">en-GB-Wavenet-D Male</option>
        <option value="en-GB-Wavenet-F">en-GB-Wavenet-F Female</option>
        <option value="en-AU-Wavenet-A">en-AU-Wavenet-A Female</option>
        <option value="en-AU-Wavenet-B">en-AU-Wavenet-B Male</option>
        <option value="en-AU-Wavenet-C">en-AU-Wavenet-C Female</option>
        <option value="en-AU-Wavenet-D">en-AU-Wavenet-D Male</option>
        <option value="en-IN-Wavenet-A">en-IN-Wavenet-A Female</option>
        <option value="en-IN-Wavenet-B">en-IN-Wavenet-B Male</option>
        <option value="en-IN-Wavenet-C">en-IN-Wavenet-C Male</option>
        <option value="en-IN-Wavenet-D">en-IN-Wavenet-D Female</option>
      </select>
      <button type="button" className="play" value="Hello">▶️</button>
    </p>
    <p>
      <label htmlFor="voice-ja">ja</label>
      <select name="voice[ja]" id="voice-ja">
        <option value="ja-JP-Wavenet-A">ja-JP-Wavenet-A Female</option>
        <option value="ja-JP-Wavenet-B">ja-JP-Wavenet-B Female</option>
        <option value="ja-JP-Wavenet-C">ja-JP-Wavenet-C Male</option>
        <option value="ja-JP-Wavenet-D">ja-JP-Wavenet-D Male</option>
      </select>
      <button type="button" className="play" value="こんにちは">▶️</button>
    </p>
    <p>
      <label htmlFor="voice-und">und</label>
      <select name="voice[und]" id="voice-und">
        <option value="en-US-Wavenet-A">en-US-Wavenet-A Male</option>
        <option value="en-US-Wavenet-B">en-US-Wavenet-B Male</option>
        <option value="en-US-Wavenet-C">en-US-Wavenet-C Female</option>
        <option value="en-US-Wavenet-D">en-US-Wavenet-D Male</option>
        <option value="en-US-Wavenet-E">en-US-Wavenet-E Female</option>
        <option value="en-US-Wavenet-F">en-US-Wavenet-F Female</option>
        <option value="en-US-Wavenet-G">en-US-Wavenet-G Female</option>
        <option value="en-US-Wavenet-H">en-US-Wavenet-H Female</option>
        <option value="en-US-Wavenet-I">en-US-Wavenet-I Male</option>
        <option value="en-US-Wavenet-J">en-US-Wavenet-J Male</option>
        <option value="en-GB-Wavenet-A">en-GB-Wavenet-A Female</option>
        <option value="en-GB-Wavenet-B">en-GB-Wavenet-B Male</option>
        <option value="en-GB-Wavenet-C">en-GB-Wavenet-C Female</option>
        <option value="en-GB-Wavenet-D">en-GB-Wavenet-D Male</option>
        <option value="en-GB-Wavenet-F">en-GB-Wavenet-F Female</option>
        <option value="en-AU-Wavenet-A">en-AU-Wavenet-A Female</option>
        <option value="en-AU-Wavenet-B">en-AU-Wavenet-B Male</option>
        <option value="en-AU-Wavenet-C">en-AU-Wavenet-C Female</option>
        <option value="en-AU-Wavenet-D">en-AU-Wavenet-D Male</option>
        <option value="en-IN-Wavenet-A">en-IN-Wavenet-A Female</option>
        <option value="en-IN-Wavenet-B">en-IN-Wavenet-B Male</option>
        <option value="en-IN-Wavenet-C">en-IN-Wavenet-C Male</option>
        <option value="en-IN-Wavenet-D">en-IN-Wavenet-D Female</option>
        <option value="ja-JP-Wavenet-A">ja-JP-Wavenet-A Female</option>
        <option value="ja-JP-Wavenet-B">ja-JP-Wavenet-B Female</option>
        <option value="ja-JP-Wavenet-C">ja-JP-Wavenet-C Male</option>
        <option value="ja-JP-Wavenet-D">ja-JP-Wavenet-D Male</option>
      </select>
      <button type="button" className="play" value="42">▶️</button>
    </p>
  </form>
)
