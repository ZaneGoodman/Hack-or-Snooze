"use strict";

// This is the global list of the stories, an instance of StoryList
let storyList;
/** Get and show stories when site first loads. */
async function getAndShowStoriesOnStart() {
  storyList = await StoryList.getStories();
  $storiesLoadingMsg.remove();

  putStoriesOnPage();
}

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns the markup for the story.
 *
 * showDeletebtn allows for the specification of which stories will have a trash can icon
 */

function generateStoryMarkup(story, showDeleteBtn = false) {
  // console.debug("generateStoryMarkup", story);

  const hostName = story.getHostName();

  const loggedIn = Boolean(currentUser);

  return $(`
  
      <li  id="${story.storyId}">
        ${loggedIn ? starHTML(story, currentUser) : ""}
        <a href="${story.url}" target="a_blank" class="story-link">
          ${story.title}
        </a>
        ${showDeleteBtn ? deleteBtnHTML() : ""}
         <small class="story-hostname">(${hostName})</small>
        <small class="story-author">by ${story.author}</small>
        <small class="story-user">posted by ${story.username}</small>
       
      </li>
    `);
}
/**
 * StarHTML checks if the passed in story is in users fav list using model.js func
 *    -change class of HTML <i> element based on favorite status
 *    -return HTML
 */
function starHTML(story, user) {
  const isFavorite = user.isFav(story);
  const starClass = isFavorite ? "gold" : "grey";

  return `
  <span class="star">
    <i  class="fa-star fas ${starClass}"></i>
  </span>`;
}

/**
 * returns html to be inserted in story li's to delete stories
 */
function deleteBtnHTML() {
  return `
  <span class="trash-can">
  <i class="fa-solid fa-trash-can"></i>
  </span>`;
}

/**
 * find trashcans Li
 * Use delete story model.js func to remove story from storylist & currentUser favorites
 * Repopulate stories
 */
async function deleteStory(evt) {
  const trashCan = $(evt.target);
  const trashCanLi = trashCan.closest("li");
  const trashCanLiId = trashCanLi.attr("id");

  await storyList.deleteStory(currentUser, trashCanLiId);
  putStoriesOnPage();
  putOwnStoriesOnPage();
}

$allStories.on("click", ".trash-can", deleteStory);

/** Gets list of stories from server, generates their HTML, and puts on page. */

function putStoriesOnPage() {
  console.debug("putStoriesOnPage");

  $allStoriesList.empty();

  // loop through all of our stories and generate HTML for them
  for (let story of storyList.stories) {
    const $story = generateStoryMarkup(story);

    $allStoriesList.append($story);
  }

  $allStoriesList.show();
}

/**On submit of newStoryForm:
 * Using user inputs create new story with model.js "addStory" func
 * Create HTML & append
 */

async function appendNewUserStory() {
  const $title = $("#title").val();
  const $author = $("#author").val();
  const $url = $("#url").val();

  const storyData = await storyList.addStory(currentUser, {
    title: $title,
    author: $author,
    url: $url,
  });
  const story = generateStoryMarkup(storyData);
  $allStoriesList.prepend(story);
  $newStoryForm.hide();
}

$newStoryForm.on("submit", appendNewUserStory);

/**
 * Put Users stories on the "my stories" ordered list by:
 *    - looping through currentUser.ownStories
 *    - GenerateStoryMarkup with story data
 *    - Show the delete icon
 */
function putOwnStoriesOnPage() {
  $ownStories.empty();

  for (let story of currentUser.ownStories) {
    const $story = generateStoryMarkup(story, (showDeleteBtn = true));

    $ownStories.append($story);
  }

  $ownStories.show();
}

/**
 * Empty favorites list
 * loop through user.favorites stories and append their story HTML
 * Show the list
 */
function putFavStoriesOnPage() {
  $favoriteStories.empty();

  for (let story of currentUser.favorites) {
    const $story = generateStoryMarkup(story);

    $favoriteStories.append($story);
  }
  $(".trash-can").hide();
  $favoriteStories.show();
}

/**
 * Add click event to all stories favoriting star
 * Use the targets closest Li Id(the story Id) to find the matching story in storyList.stories
 * Add/Remove story from favorites using model.js User funcs by:
 *        - toggling star class to opposite of the current class
 *        - calling appropriate add/remove model.js func which will:
 *               * remove/add the passed in story from currentUser.favorites
 */
async function favStarType(evt) {
  const $star = $(evt.target);
  const targetLi = $star.closest("li");
  const targetId = targetLi.attr("id");
  const story = storyList.stories.find((s) => s.storyId === targetId);

  if ($star.hasClass("grey")) {
    $star.toggleClass("gold grey");
    currentUser.addFav(story);
  } else if ($star.hasClass("gold")) {
    $star.toggleClass("grey gold");
    currentUser.removeFav(story);
  }
}

$allStories.on("click", ".star", favStarType);
