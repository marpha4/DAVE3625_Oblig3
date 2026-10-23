# DAVE3625: Assignment 3

Husholdningen is a web application that gives everyone in a household a shared overview of the shopping list and household chores. Different users in the same household are simulated by switching between profiles. 

## Features
* **Members:** Add and remove members, change name and profile color, and change profile in the top rigth corner. Each member has their own color, making it easy to see who did what and who is responsible for what. 
* **Shopping List:** Items are added with quantity, category and a comment. The list shows who added and edited each item. Items can be checked off, edited and deleted. 
* **Household chores:** Chores are added and can be assigned to a member. When a chore is checked off, the app shows who did it. Filter on "Alle" and "Mine oppgaver. 

## Technologies
* HTML, CSS and JavaScript
* Bootstrap
* `localStorage` for storing data in the browser

## Use of AI
The app was built with Claude. The work started with brainstorming and a plan for the features, which were turned into issues on GitHub. For each feature, Claude suggested code, which was tested and adjusted with new prompts until the result was as intended. Each finished feature was commited and merged with a pull request. 

Example prompts (translated from Norwegian):

**Planning**
> I want to build a web app for a household with a shared shopping list and chores. Data is stored in localStorage, and you choose which household member you are at the top of the page. Help me make a simple plan with features and order.
 
**First code**
> Make a simple website with HTML, CSS and JavaScript. It should have a menu for choosing a household member. It should be possible to add and remove members. Each member should have a name and their own color.
 
**Design**
> It doesn't look very nice, can you use Bootstrap to style the header?
 
**Bug**
> When you check off an item, a line goes through the item name. Can you make the line continue through the quantity as well?
 
**New feature**
> Instead of minus and plus buttons for adjusting the quantity, there should be an «Edit» button where you can change the item name, quantity and category.

## Testing and Improvements
Each feature was tested with user flows suggested by Claude, for example adding an item as one person and checking that the right name is shown after switching profile, and that everything is saved after reloading the page. Tests were done on both desktop and mobile screen sizes.

Examples of improvements:
* The line through checked items broke between the item name and quantity, and was replaced with one continuous line
* Buttons and fields were adjusted in size and placement
* The add button was moved below the comment field, so the form follows the order it is filled in
* Items and chores got an edit button and a confirmation before deleting
* The browser's default category menu was replaced with a Bootstrap menu that looks the same on all devices
* Household chores were moved to a separate page with tabs, instead of being placed below the shopping list