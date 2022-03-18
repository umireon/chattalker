import { File as FileNode, FormData as FormDataNode } from 'formdata-node'

import type { FetchAutioResponse } from './audio'
import { handleFetchAudioResponse } from './audio'

test('handleFetchAudioResponse processes a proper FormData', () => {
  const audioContent = new FileNode(['file'], 'file.mp3') as unknown as File
  const language = 'en'
  const formData = new FormDataNode() as FormData
  formData.append('audioContent', audioContent)
  formData.append('language', language)
  const actual = handleFetchAudioResponse(formData)
  const expected: FetchAutioResponse = { audioContent, language }
  expect(actual).toEqual(expected)
})

test('handleFetchAudioResponse throws against invalid audioContent', () => {
  const audioContent = 'invalid'
  const language = 'en'
  const formData = new FormDataNode() as FormData
  formData.append('audioContent', audioContent)
  formData.append('language', language)
  expect(() => handleFetchAudioResponse(formData)).toThrow(Error)
})

test('handleFetchAudioResponse throws against invalid language', () => {
  const audioContent = new FileNode(['file'], 'file.mp3') as unknown as File
  const language = new FileNode(['invalid'], 'invalid') as unknown as File
  const formData = new FormDataNode() as FormData
  formData.append('audioContent', audioContent)
  formData.append('language', language)
  expect(() => handleFetchAudioResponse(formData)).toThrow(Error)
})
