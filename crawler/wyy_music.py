import os
import requests
import execjs
import subprocess
from functools import partial
from concurrent.futures import ThreadPoolExecutor

subprocess.Popen = partial(subprocess.Popen, encoding='utf-8')

HEADERS = {
    "accept": "*/*",
    "accept-language": "zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7",
    "content-type": "application/x-www-form-urlencoded",
    "origin": "https://music.163.com",
    "priority": "u=1, i",
    "referer": "https://music.163.com/",
    "sec-ch-ua": "\"Google Chrome\";v=\"131\", \"Chromium\";v=\"131\", \"Not_A Brand\";v=\"24\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
}

COOKIES = {
    "NMTID": "00OgqXrFy2ifhkuYkijm3K6KtHq2yYAAAGTqrThkQ",
    "_iuqxldmzr_": "32",
    "_ntes_nnid": "25b24837f954369e682a6b4a7fff0d94,1733735800719",
    "_ntes_nuid": "25b24837f954369e682a6b4a7fff0d94",
    "WEVNSM": "1.0.0",
    "WNMCID": "inertb.1733735801762.01.0",
    "WM_TID": "ASnkuhgsTWxBVEUVFFLHStmYznGs0uGA",
    "ntes_utid": "tid._.FSF90NqlcJVEUkERVBKGHsmcyiGvcXw%252F._.0",
    "sDeviceId": "YD-CseXyC9f65tFFxQAABODDoyZm3G%2FcHyR",
    "__snaker__id": "VZEXsV8mxy9Pi0Ja",
    "P_INFO": "18982949308|1733735825|1|music|00&99|null&null&null#CN&null#10#0|&0||18982949308",
    "MUSIC_U": "006EB52A3292CE8CDC45589811386635FFDC35B18DE3B81E6791046329EBDA401E467B70BA2BE972D6BE4BC432A943BBF9B4417E87C0C49E2E403A68EA129CED3DFB385C511B7F12247A42E3CCB9A97299DE407C1EC832F6915E46DC0B846F2B6B3BB8F98E65AAE2A48FE74E669F357B8CDF96AACA628FE00995FBDE51BF6235C9D41DF24B255207A7AD58E42F92BD6B1ACE56A5D6C122F0E34348F41536F05F045094D7F80F258B2E4B8937D0DEEA0516EF1B70A726B10BB5C6F3F8A42DFD1B3E4699684A5FBBFE66D7AB3E57DD5FB832280086A3DB78ADCC3A823FA19B77E6C6A99DACBC6AF8234FB88F6C5E72B30442CC763EBA3B3D8DF57285B1CF954906B344FAE92473CD6C088A07783BF391333EA33CE46B557D8B43BE38D352E6110CAB708927F49064E705D46569236601A817BA3D1CD283CEDAA65C1FFA42A3002643D39AF110D8A177DCAFFADACC7D2177CF1B1631CB25935B8F2114CEDB392BEEF1",
    "__remember_me": "true",
    "ntes_kaola_ad": "1",
    "__csrf": "1b78a3f9fabe8b2f19e316b5c377a617",
    "JSESSIONID-WYYY": "xl%2B9%2Fvvy%5CpGzm3W%5CR3vpDuMSgR6FPGsFIhyeyDeJNnQaJdqy4rkNQs%2FtCzB%5CMX5J8Me4Et5vnPSfTeCYtRbjxvDpiKIS%2FVxA1FiXlJ%2FidssMspuzYEGkr%2ByPVPB%2B7zuO%5C9mzdQhbXR8xx89EYIKxlPNY48bQiT7mFWZDBmYOPm%2BRrmx6%3A1737715555443",
    "WM_NI": "jhCn9r%2F%2BwG%2FfX19cjBhLEM9TyYXA7HrUG4jV4DskYCDSkerQhZgMU6Jp5pUFTZ5rdaYMzQ6mwsBtxBG%2FzCWQoqet4eZLMLzLdH7GJ0GUTWYNcIKdoy1AR3rfotMaOtKBazU%3D",
    "WM_NIKE": "9ca17ae2e6ffcda170e2e6eeaef75bbb9ebca9aa64a8ef8eb2d55a978a9f83d742a893ba95d37ea2b48ebbd92af0fea7c3b92aaab88d8fbc7aedf5b9a8ae6e9ceff784e94aac948baebc60bb8798a2b644b28b89d5e95ef89cbd8cdc49888da586f15bac86a9aed83e8ab0fb91d84e9886fb93e76b9b93b6b2b567b5ad8e95fb4a85f1b6a4d65badafab95b76f9a9483adf948a898f9a8c93c858b9cb8dc46a1978585ee73f39f9ed4f16eadac8382ce80899eaf9bd837e2a3"
}

SEARCH_URL = "https://music.163.com/weapi/cloudsearch/get/web"
SONG_URL = "https://music.163.com/weapi/song/enhance/player/url/v1"
LYRIC_URL = "https://music.163.com/weapi/song/lyric"
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
JS_FILE = os.path.join(BASE_DIR, "逆向js文件", "code.js")

try:
    with open(JS_FILE, 'r', encoding='utf-8') as f:
        js_context = execjs.compile(f.read())
except FileNotFoundError:
    raise RuntimeError(f"JavaScript 文件 {JS_FILE} 未找到。")


def generate_params(data):
    ee = '010001'
    ff = '00e0b509f6259df8642dbc35662901477df22677ec152b5ff68ace615bb7b725152b3ab17a876aea8a5aa76d2e417629ec4ee341f56135fccf695280104e0312ecbda92557c93870114af6c9d05c4f7f0c3685b7a46bee255932575cce10b424d813cfe4875d3e82047b97ddef52741d546b8e289dc6935b3ece0462db0a22b8e7'
    gg = "0CoJUm6Qyw8W8jud"
    return js_context.call('get_wyy', data, ee, ff, gg)


def search_music(song_name):
    search_data = {
        "s": song_name,
        "type": "1",
        "offset": "0",
        "total": "true",
        "limit": "90",
        "csrf_token": COOKIES["__csrf"],
    }
    encrypted_data = generate_params(str(search_data))
    data = {"params": encrypted_data['encText'], "encSecKey": encrypted_data['encSecKey']}
    response = requests.post(SEARCH_URL, headers=HEADERS, cookies=COOKIES, data=data)
    response.raise_for_status()
    res = response.json()
    songs_data = res.get("result", {}).get("songs", [])

    # 使用 ThreadPoolExecutor 来并行获取歌词
    with ThreadPoolExecutor(max_workers=5) as executor:
        lyrics = list(executor.map(get_lyric, [song['id'] for song in songs_data]))

    return [{
        "SongName": song["name"],
        "SingerName": ", ".join(artist["name"] for artist in song["ar"]),
        "play_url": f"http://music.163.com/song/media/outer/url?id={song['id']}.mp3",
        "img": song["al"]["picUrl"],
        "lyrics": lyric
    } for song, lyric in zip(songs_data, lyrics)]


def get_lyric(song_id):
    lyric_data = {"id": song_id, "lv": -1, "tv": -1, "csrf_token": COOKIES["__csrf"]}
    encrypted_data = generate_params(str(lyric_data))
    data = {"params": encrypted_data['encText'], "encSecKey": encrypted_data['encSecKey']}
    response = requests.post(LYRIC_URL, headers=HEADERS, cookies=COOKIES, data=data)
    response.raise_for_status()
    return response.json().get("lrc", {}).get("lyric", "歌词获取失败")


if __name__ == '__main__':
    song_name = input()
    print(search_music(song_name))
