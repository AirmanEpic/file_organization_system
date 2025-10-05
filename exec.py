# get the first argument passed

import sys
import os
import subprocess

# get the first argument passed

# run a process with the argument
working_dir = 'D:\Docs\Portfolio 2\Inspiration\\thing project'
os.chdir(working_dir)
print(os.popen( r'electron . "' + sys.argv[1]+'"').read())