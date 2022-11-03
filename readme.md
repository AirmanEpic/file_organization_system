do not look at the code if you enjoy seeing
it's stored in inapp.js
there's also some stuff in app.js

sort_and_display_2 does a lot of fun stuff
so does parse_word

install with npm i .

run with electron .

if it doesn't work message me

you need to open up settings and point it to the relative file location of the image collection. I can make a file prompt show up for that.

when you're in:

"Word" means a search tag. Could be any tag or any special tag.

type the word you're searching for. Space delimits words. Words work in "or" mode by default so if you searched "wings horns" you'd see all images tagged with "wings" and any tagged with "horns" or both.

add - before a word to remove any word matching that thing

add + before a word to require that word be present

special words:

 - special:any matches all items

 - special:notags matches all untaged items

 - special:tagged matches all tagged items

 - special:starred matches all favorited items

 - folder:<x> matches all items in a folder containing <x>

 - color:<x>$<y> matches all items with <x> (a pantone or x11 color) in them with range <y> (Very slow) (only 1 color search allowed per string)

 - limit:<x> limit the responses to <x> matches

Sorting: you can also sort your matches

 - sortby:date sorts by modified date of the file, new first

 - sortby:date_old '' but old first

 - sortby:random sorts randomly

 - sortby:view_new shows images in the order last viewed (for images that haven't been viewed, they're first and random)

 - sortby:view_old shows images in the order latest viewed (IE an image that you see will be next)

 