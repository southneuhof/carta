import fileinput
import sys
import re

_hex_colour = re.compile(r'#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b')

def replace(match):
    value = match.group(1)
    if len(value) == 3:  # short group
        value = [str(int(c + c, 16)) for c in value]
    else:
        value = [str(int(c1 + c2, 16)) for c1, c2 in zip(value[::2], value[1::2])]
    return '{}'.format(' '.join(value))

for line in fileinput.input(inplace=True):
    line = _hex_colour.sub(replace, line)
    sys.stdout.write(line)