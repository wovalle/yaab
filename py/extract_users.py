from telethon.tl.functions.channels import GetParticipantsRequest
from telethon.tl.types import ChannelParticipantsSearch
from time import sleep
import json


from telethon import TelegramClient, sync

# These example values won't work. You must get your own api_id and
# api_hash from https://my.telegram.org, under API Development.
api_id = 19677
api_hash = '148799d4c2ae7d203027529617c5146d'

client = TelegramClient('session_name', api_id, api_hash).start()

offset = 0
limit = 100
all_participants = []

# Getting information about yourself
me = client.get_me()

group = -1001376022771
dialogs = client.get_dialogs()

#Get  the participants
while True:
    participants = client(GetParticipantsRequest(
        group, ChannelParticipantsSearch(''), offset, limit, hash=0
    ))
    if not participants.users:
        break
    all_participants.extend(participants.users)
    offset += len(participants.users)

print('Participants #:', len(all_participants))

def map_user(u):
  return {
      'id': u.id,
      'is_self': u.is_self,
      'bot': u.bot,
      'bot_chat_history': u.bot_chat_history,
      'bot_nochats': u.bot_nochats,
      'verified': u.verified,
      'restricted': u.restricted,
      'access_hash': u.access_hash,
      'first_name': u.first_name,
      'last_name': u.last_name,
      'username': u.username,
      'phone': u.phone 
      }

users = []

for p in all_participants:
    users.append(map_user(p))

with open("users.json", "w") as write_file:
    json.dump(users, write_file)