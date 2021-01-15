import glob
import os
import zipfile
from pathlib import Path
from tkinter import Tk
from tkinter.filedialog import askopenfilename

from PIL import Image

Tk().withdraw() # we don't want a full GUI, so keep the root window from appearing
filename = askopenfilename() # show an "Open" dialog box and return the path to the selected file

target_directory = Path('./images') / Path(filename).name

with zipfile.ZipFile(filename, 'r') as zip:
    zip.extractall(target_directory / 'jfif')

files = glob.glob(str(target_directory) + "/jfif/*.jfif")
files.sort()

os.mkdir(target_directory / 'jpg')

for count, file in enumerate(files):
    im = Image.open(file)
    im.save(target_directory / 'jpg' / f'frame_{str(count + 1).zfill(4)}.jpg', "JPEG")

print(files)
