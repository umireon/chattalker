import type { TwitchUsersResponse } from './twitch'
import { validateTwitchUsersResponse } from './twitch'

test('validateTwitchUsersResponse agrees with valid TwitchUsersResponse', () => {
  const response: TwitchUsersResponse = {
    data: [
      {
        login: '',
      },
    ],
  }
  expect(validateTwitchUsersResponse(response)).toBeTruthy()
})

test('validateTwitchUsersResponse disagrees with invalid data', () => {
  const response = {
    error: '',
  }
  expect(validateTwitchUsersResponse(response)).toBeFalsy()
})
