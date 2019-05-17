from telethon.tl.functions.channels import GetParticipantsRequest
from telethon.tl.types import ChannelParticipantsSearch
from time import sleep
from secrets import api_hash, api_id, group_id
import json



from telethon import TelegramClient, sync

# These example values won't work. You must get your own api_id and
# api_hash from https://my.telegram.org, under API Development.
# create a secrets.py file and store them.

client = TelegramClient('session', api_id, api_hash).start()

offset = 0
limit = 100
all_participants = []

# Getting information about yourself
me = client.get_me()

dialogs = client.get_dialogs()

# #Get  the participants
while True:
    participants = client(GetParticipantsRequest(
        group_id, ChannelParticipantsSearch(''), offset, limit, hash=0
    ))
    if not participants.users:
        break
    all_participants.extend(participants.users)
    offset += len(participants.users)

print('Participants #:', len(all_participants))

def map_user(u):
  return {
      'id': str(u.id),
      'is_bot': u.bot,
      'first_name': u.first_name,
      'last_name': u.last_name,
      'username': u.username,
      'last_message': None,
      'role': 'user',
      'status': 'active',
      'protected': False,
      'warnings': []
      }

users = []

for p in all_participants:
    users.append(map_user(p))

users_json = json.dumps(users)

with open("users.json", "w") as write_file:
    write_file.write(users_json)