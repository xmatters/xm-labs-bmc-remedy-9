# Instructions on creating the repo
This file is divided up into two parts, the first is instructions on creating the repo and cloning the template, the second part is the template for the `README.md` file that will serve as the home page and installation instructions for the integration. 

Some examples to emulate:
* [Logz.io](https://github.com/xmatters/xm-labs-logz.io-elk)
* [StatusPage](https://github.com/xmatters/xm-labs-statuspage)

## 1. Create the repo
[Create the repo](https://help.github.com/articles/create-a-repo/) using your own GitHub account. Please prefix the name of the repo with `xm-labs-` and all in lower case. When you create the repo don't add a README or LICENSE; this will make sure to initialize an empty repo. 

## 2. Clone the template
*Note*: These instructions use git in the terminal. The GitHub desktop client is rather limited and likely won't save you any headaches. 

Open a command line and do the following. Where `MY_NEW_REPO_NAME_HERE` is the name of your GitHub repo and `MY_NEW_REPO_URL` is the url generated when you create the new repo. 

```bash
# Clone the template repo to the local file system. 
git clone https://github.com/xmatters/xm-labs-template.git
# Change the directory name to avoid confusion, then cd into it
mv xm-labs-template MY_NEW_REPO_NAME_HERE
cd MY_NEW_REPO_NAME_HERE
# Remove the template git history
rm -Rf .git/
# Initialize the new git repo
git init
# Point this repo to the one on GitHub
git remote add origin https://github.com/MY_NEW_REPO_URL.git
# Add all files in the current directory and commit to staging
git add .
git commit -m "initial commit"
# Push to cloud!
git push origin master
```

## 3. Make updates
Then, make the updates to the `README.md` file and add any other files necessary. `README.md` files are written in GitHub-flavored markdown, see [here](https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet) for a quick reference. 


## 4. Push to GitHub
Periodically, you will want to do a `git commit` to stash the changes locally. Then, when you are ready or need to step away, do a `git push origin master` to push the local changes to github.com. 

## 5. Request to add to xM Labs
Once you are all finished, let Travis know and he will then fork it to the xMatters account and update the necessary links in the xM Labs main page. From there if you update your repo, those changes can be merged into the xMatters account repo and everything will be kept up to date!

# Template below:
---

# Product Name Goes Here
A note about what the product is and what this integration/scriptlet is all about. Check out the sweet video [here](media/mysweetvideo.mov). Be sure to indicate what type of integration or enhancement you're building! (One-way or closed-loop integration? Script library? Feature update? Enhancement to an existing integration?)

# Pre-Requisites
* Version 453 of App XYZ
* Account in Application ABC
* xMatters account - If you don't have one, [get one](https://www.xmatters.com)!

# Files
* [ExampleCommPlan.zip](ExampleCommPlan.zip) - This is an example comm plan to help get started. (If it doesn't make sense to have a full communication plan, then you can just use a couple javascript files like the one below.)
* [EmailMessageTemplate.html](EmailMessageTemplate.html) - This is an example HTML template for emails and push messages. 
* [FileA.js](FileA.js) - An example javascript file to be pasted into a Shared Library in the Integration builder. Note the comments

# How it works
Add some info here detailing the overall architecture and how the integration works. The more information you can add, the more helpful this sections becomes. For example: An action happens in Application XYZ which triggers the thingamajig to fire a REST API call to the xMatters inbound integration on the imported communication plan. The integration script then parses out the payload and builds an event and passes that to xMatters. 

# Installation
Details of the installation go here. 

## xMatters set up
1. Steps to create a new Shared Library or (in|out)bound integration or point them to the xMatters online help to cover specific steps; i.e., import a communication plan (link: http://help.xmatters.com/OnDemand/xmodwelcome/communicationplanbuilder/exportcommplan.htm)
2. Add this code to some place on what page:
   ```
   var items = [];
   items.push( { "stuff": "value"} );
   console.log( 'Do stuff' );
   ```


## Application ABC set up
Any specific steps for setting up the target application? The more precise you can be, the better!

Images are encouraged. Adding them is as easy as:
```
<kbd>
  <img src="media/cat-tax.png" width="200" height="400">
</kbd>
```

<kbd>
  <img src="media/cat-tax.png" width="200" height="400">
</kbd>


# Testing
Be specific. What should happen to make sure this code works? What would a user expect to see? 

# Troubleshooting
Optional section for how to troubleshoot. Especially anything in the source application that an xMatters developer might not know about, or specific areas in xMatters to look for details - like the Activity Stream? 
