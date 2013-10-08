# Tempie ![A Pie](https://raw.github.com/onmodulus/node-tempie/master/pie.png)
A delicious way to manage email templates.

Tempie is nothing special when it comes to the actual templates. It utilizes [handlebars](https://github.com/wycats/handlebars.js/) to process HTML templates, which is well known and proven as far as templates go. What Tempie does provide is a flexible loading mechanism that allows you to organize your templates in several different ways. It will also handle compiling CSS into the HTML and generate a text-only version of the email.

## Install
    
    npm install tempie

## Quick Start
Once installed, all you need to do is include it and save some template files.

```javascript
var tempie = require('tempie');
//...some more code
var myEmail = tempie.load('newuser', userData, callback);
//myEmail
{
    "subject": "Welcome User!",
    "html": "<html><head>...</head><body>Welcome <em>Tony Stark</em>!</body></html>",
    "text": "Welcome Tony Stark!"
}
```


There are a few different ways you can organize your templates, but the preferred method is each template being in its own folder inside a _templates_ directory. Each file must share the same name in order to be loaded.

<pre>
- MyProject
  - myproject.js
  - templates
    - newuser
      - newuser.html
      - newuser.css
      - newuser.json
</pre>

You can also just throw all the files inside the _templates_ directory if you find subfolders annoying. As long as the files have the same name, Tempie will find them in both cases.

<pre>
- MyProject
  - myproject.js
  - templates
    - newuser.html
    - newuser.css
    - newuser.json
</pre>

The HTML and CSS files are self explanatory, with the HTML file being a handlebars template. Treat the template as the __body__ of the HTML document, with the CSS file being added to a __style__ tag in the head. A text-only version will also automatically generated from the processed template and added to the returned object.

The JSON file holds anything that you wish to be part of the email object returned when loaded. Typically these are things like the subject, the "from" email, etc. There is no restrictions and what you can add, but the only field that will currently be defaulted if not present is the subject.

```javascript
{
    "subject": "Welcome User!"
}
```

If you prefer a single json configuration for all of your email templates, you can create an _emails.json_ file in the templates root. Keep in mind this will not be reloaded on each load call, so you have to use separate JSON files for "hot loading" of new templates.

<pre>
- MyProject
  - myproject.js
  - templates
    - emails.json
    - newuser.html
    - newuser.css
</pre>

The only difference in structure is the _emails.json_ requires the top-level to have the name of the template as the key.

```javascript
{
    "newuser": {
        "subject": "Welcome User!"
    }
}
```