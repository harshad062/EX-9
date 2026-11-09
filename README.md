# Halcyon Cove Local Guide

A static local tourism guide with search, category filters, sorting, expandable
visit tips and a day planner that remembers your choices in the browser.

## Files

| File          | Purpose                                      |
|---------------|----------------------------------------------|
| `index.html`  | Page structure and content                   |
| `styles.css`  | Visual design, layout and responsive rules   |
| `data.js`     | The places list. Edit this to add your own   |
| `app.js`      | Search, filter, sort, tips and planner logic |

## Run it

No build step or server is needed. Open `index.html` in any modern browser.
Google Fonts are loaded from the internet, so the page falls back to Georgia and
a sans-serif font if you are offline.

## Adding a place

Open `data.js` and add an object to the `PLACES` array:

```js
{
  id: "my-new-place",          // unique, lowercase, no spaces
  name: "My New Place",
  category: "Outdoors",        // categories are created automatically
  minutes: 60,                 // typical visit length
  price: 0,                    // 0 = free, 1 = $, 2 = $$, 3 = $$$
  summary: "One or two sentences about the place.",
  bestTime: "When to go.",
  tip: "One practical tip."
}
```

## Changing the sample town

The sample town is called Halcyon Cove and all content is placeholder text. To
use your own town, change the name in `index.html` (the header, hero and footer)
and replace the entries in `data.js`.

## Browser support

Works in current versions of Chrome, Edge, Firefox and Safari. Layout adapts to
phone, tablet and desktop widths.
