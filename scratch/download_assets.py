import os
import urllib.request
import re

# Ensure assets/artifacts directory exists
os.makedirs("assets/artifacts", exist_ok=True)

# List of all figma assets to fetch
assets = [
    # Public Home
    "3ca236779da279f7ff423a546fa7904bc2ac9b57.png",
    "160095c88f5b7a8f4f9f50d6513ef48b8d22c57a.png",
    "79aad29bbfb010846618fb19ad5be3e82ef3dc61.png",
    "acd069259d3e644102e01db4b7f208c0246b17cd.png",
    "5296c3fa08d4616a341b2efbf44e2e24fab60a5a.png",
    "6161d0e60c244782ce756ece7fa3340c217755ff.png",
    "46a29d3d7570ed30a0a40e1f7a98d101db07d277.svg",
    "572a7b7565cba6f7b62812eb6e3d9d00a554aa44.svg",
    
    # Domo Experience
    "90273a409d58628526520e934acc401a7b61d4f5.png",
    "14003e3845c40e82a56f2b0312749f84085c1651.png",
    "3fb38c4dee4b734adc5637dd6ec7b1a8d96ada80.png",
    "7673cfedb5de9f7a68ba23bb789aee0b08fadf9e.svg",
    "699cc22849f14de59d029e3db6f3652eba39e8a2.svg",
    "a0e9b660b4a57c07732a468dcadf5dfbfa64d4b1.svg",
    "518fa9356460ae3d3d9ccd3e5f333681079f3a77.svg",
    "b246313d7e1e9e33ac98e2b04bded61b49620dde.svg",
    "824e87b1f09627ffe343d4cbc65aae269484a855.svg",
    "7ea867cd55e8f9b4216b75f61a8ad646a67b3d5a.svg",
    "3ef4797872a113440a5e54b69e9646f1df272f48.svg",
    "2677e6525037d5b809f4d6da08f6c7773c805785.svg",
    "6dfab3415df3ce4f5d88228d81c11adae1bee799.svg",
    "32d0ccbb0f68593411ca2a6a253ba5b605bd4265.svg",
    "4341517b8c60b8c2996154a8f67705da5f781195.svg",
    "0fd88eb5164d3a6931a24f02c0a4d92d2a556bc0.svg",
    "27263deed4ed27b1f959dd87f0e9646cbb94ba81.svg",
    "0e67de4f293d5f121f3e98fafc49eb53aa8b9233.svg",
    "5e7f4ea262c273e1b19e97e549c6ae51ea53f4b8.svg",
    "68125e06389c9e5a64e8152dc1b60ec7ade71130.svg",
    "3eb7e5d5410277dd2ebbdc3e40edbbbbd2a2647f.svg",
    "5580ac93543ce37c8b2e0a719cb182421cc7dd85.svg",
    "ff37482fac9f14d6acab0ee11ee4e0e684803fa1.svg",
    "4ff254a616818d2e8c57967303aec4b4f4bd1b4a.svg",
    "6fd60e77908c651661c88b1daac15765e6aba425.svg",
    "ca5c8d700f1d46ee8f3e2e13baee6a568e4bb4b0.svg",
    "cba08ca36a0f6eab2693599c289837ccb96b11bf.svg",
    "98eb3cfa75005522c29e8a5f8a5a6beed0f43574.svg",
    "f7cc710142839a872bedb723fa1f6f50fa6d97ab.svg",
    "de12cffe84671675b2e98519d790458bbfdca4a9.svg",
    "6f85e80cb6e2d6f91c7cf2659e7653d22d91570b.svg",
    "a3dc85f9f2d5e5147823d8db770dd507bdb9d772.svg",
    "4fbf71839e407844ca8a9ad16f2d42c7dc267273.svg",
    "783e795f5a536739c60a5c8c4e72398b9fd1579a.svg",
    "936e939db5ad5e9d6f126df5b4f46539bde7d2aa.svg",
    "500d68530eadc17d405c7e20f76faf94c45f2441.svg",
    "12a2c063d8499ed30c774d7bc9ac4eb259eebdba.svg",
    "bb7d3a73716cb85c4468c61edb8b292a7eaa62ba.svg",
    "6b747f9968bd25979784dcb0bf61804bb5050447.svg",
    "07948b6698d9b218302b69471ec7fa8bd1e251b1.svg",
    "a7baf6eba9d06b97a6824a1bd854274c58f0c6c2.svg",
    "3c86ccf3d2f73c759167710dfa834122e3c25403.svg",
    "7653dcabac1d60a12422638a974942f6a4e804ce.svg",
    "9139036c407221293be63a7a7a880018db48d67b.svg",
    "acacc3aa4a563e0675b0c8a16275ac4f89f9cce1.svg",
    "4e7fdd878a61eab08ed1730d7ca7bd310a1134d1.svg",
    "da9a6c14b6400dee6025436f125d6655fd479b51.svg",
    "ddbd5dc89962abfd69bd89404a84927cbbe7bd4c.svg",
    "816e55e9dda0a0051147cd776bcad1636b08d8c0.svg",
    "9eb8d7a2cb4d3201e6ee1ce4eb1bfc8f3ea479ff.svg",
    "33b7bd17040c5f73e8427b7874c52a693f571b42.svg",
    "b7ed376300668e5075469a423321cf95e13e533f.svg",
    "91a3f8c9813464ae6411f25d16840d18c0ac1e9b.svg",
    "24e9b87f0a925e21e781efdb1497a25329e0cf2b.svg",
    "ac6606aa8807e41c158d9c7ccde66d8605e6e2d1.svg",
    "d0b3d425abb89b1d347cb1608e86524e9044e3ff.svg",
    "844282e4f768aacba30241c6a207fa17728600bb.svg",
    "632ee5cb3063b2e3bd594f35802ca6b497089509.svg",
    "8e05094c50050e6cd4468fad50ca5add8241238a.svg",
    "617ef63240f7099f237e02fb1421590b63d99a78.svg",
    "294fe645f28078bfae0c16386d4167e9052bd934.svg",
    "1632d4ba6a911ea65ca59feaa168071a3afd7864.svg",
    "3df1d9980def34a67fea17885b40eb04821016f9.svg",
    "844fffb93496401a8105cce85964b18a3fff933a.svg",
]

# De-duplicate
assets = sorted(list(set(assets)))

print(f"Starting download of {len(assets)} assets...")
downloaded = 0
failed = 0

for asset in assets:
    url = f"http://localhost:3845/assets/{asset}"
    target_path = os.path.join("assets/artifacts", asset)
    if os.path.exists(target_path):
        print(f"Skipping (already exists): {asset}")
        downloaded += 1
        continue
    try:
        urllib.request.urlretrieve(url, target_path)
        print(f"Downloaded: {asset}")
        downloaded += 1
    except Exception as e:
        print(f"Failed to download {asset} from {url}: {e}")
        failed += 1

print(f"Finished. Success: {downloaded}, Failed: {failed}")
