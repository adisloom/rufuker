// ==UserScript==
// @name         Rufuker
// @namespace    https://2ch.hk/
// @version      0.33
// @description  Culturally enriches the pidorussian lingamus
// @author       Anon
// @match        *://2ch.hk/*
// @match        *://2ch.pm/*
// @icon         https://www.google.com/s2/favicons?domain=2ch.hk&sz=64
// @grant        none
// ==/UserScript==

/**********************************************************************************
*
*                           NOTICE
*
* The script requires the browser plugin "Tampermonkey".
* Set "Run only in top frame" to "No" in plugin's settings for the script.
*
* It may also work in other usercript manager plugins:
* GreaseMonkey, ViolentMonkey etc, except for FireMonkey.
*
***********************************************************************************/

(function() {
    'use strict';

    const aThreads = $('.thread');
    if (aThreads.length == 0) return;

    const rufuker_replacement_rules = [
        // xx -> yy
        // xxx -> yyy
        // changing text length causes flickering in a preview popup
        ['ий народ', 'ай на рот'],
        ['ски', 'зке'],
        ['еще', 'ышо'],
        ['когда', 'кахда'],
        ['деньг', 'теньг'],
        ['денег', 'дынек'],
        ['денеж', 'дыняш'],
        ['ого([ \s,\.\-:])', 'ава$1'],
        ['о([влрт])о', 'а$1а'],
  //      ['[иы]й([ \s,\.\-:])', 'ы$1'], 
        ['([^ \s,\.\-:])ие([ \s,\.\-:])', '$1$1е$2'],
        ['ри', 'ґи'],
        ['ре', 'ґе'],
        ['ря', 'ґя'],
        ['рь', 'гх'],
        ['ти', 'це'],
        ['те', 'ця'],
        ['тя', 'ца'],
        ['ди', 'дэ'],
        ['де', 'ды'],
        ['ши', 'шэ'],
        ['ше', 'ша'],
        ['жи', 'жэ'],
        ['же', 'жа'],
        ['си', 'се'],
        ['ио', 'её'],
        ['иа', 'ея'],
        ['иу', 'ею'],
        ['ие', 'ее'],
        ['ться', 'тцца'],
        ['тся', 'тсо'],
        ['дь', 'ць'],
        ['ть', 'ць'],
        ['ли', 'ле'],
        ['че', 'це'],
        ['([жшч])ь', '$1$1'],
        ['щ', 'ш'],
        ['([^ \s,\.\-:])и([ \s,\.\-:])', '$1е$2'],
        ['ъе', 'йэ'],
        ['ъё', 'йо'],
        ['ъю', 'йу'],
        ['ъя', 'йа'],
//        [' и([ \s,\.\-:])', ' ды$1'],
//      [' И([ \s,\.\-:])', ' ДЫ$1'],
        ['и', 'ы'] ];

    const aReplacement = rufuker_replacement_rules.map( c => ({ sRegex: new RegExp(c[0],'g'), sSubst: c[1] }) );

    function replace_str(txt) {
        for (let r of aReplacement) {
            txt = txt.toString().replace(r.sRegex, r.sSubst);
        }
        return txt;
    }

    function replaceArticleByNum(idNum) {
        let id_article = 'm' + idNum;
        var el = document.getElementById(id_article);
        el.innerHTML = replace_str(el.innerHTML);
    }

    function replacePostPreviewByNum(idNum) {
        //must address through a parent container because the site uses a similar dom-ID on for preview articles
        let id_preview = 'preview-' + idNum;
        var el = document.getElementById(id_preview);
        for (const ch of el.children) {
            if (ch.nodeName === 'ARTICLE') {
                ch.innerHTML = replace_str(ch.innerHTML);
                return true;
            };
        }
        return false;
    }

    function getElementNumsFromNodeList(nodeList) {
        let aIdNums = new Set(); //unique
        nodeList.forEach(el => aIdNums.add( el.id.match(/\d{3,}/g).pop() ) ); //need the 3+ digits from the ned
        aIdNums.delete(null);
        aIdNums.delete(undefined);
        return Array.from(aIdNums);
    }

    function getElementNumsFromParent(selector, parentElement) {
        const aElements = parentElement.querySelectorAll(selector);
        return getElementNumsFromNodeList(aElements);
    }

    function getArticleNums(parentElement) {
        return getElementNumsFromParent('article.post__message', parentElement);
    }

    function getThreadPostNums(parentElement) {
        const op = getElementNumsFromParent('div.thread__oppost', parentElement);
        const cm = getElementNumsFromParent('div.thread__post', parentElement);
        return Array.from(new Set(op.concat(cm))); //unique
    }

    function getPostPreviewNums(parentElement) {
        return getElementNumsFromParent('div.post_preview', parentElement);
    }

    //Reaplce posts added by scrolling or preview popups
    const handleScrollAndPopup = function(mutationsList, observer) {
        //Todo Get rid of popup flicker on a main board page.
        // https://developer.mozilla.org/en-US/docs/Web/API/MutationRecord
        for(const mutation of mutationsList) {
            if (mutation.type === 'attributes' || mutation.type === 'characterData') {
                console.log('Mutation in handleScrollAndPopup, Something was modified.');
            }
            else if (mutation.type === 'childList') {
                console.log('Mutation in handleScrollAndPopup: A child node has been added or removed.');
            }
        }
        const aCurrentPostNums = getThreadPostNums(workingElement); //bug
        //const aCurrentPostNums = getArticleNums(workingElement);
        let aNewPostNums = aCurrentPostNums.filter(x => !aInitialPostNums.includes(x));
        aNewPostNums.map( idNum => replaceArticleByNum(idNum) );
        // todo optimize MutationRecord
        // post preview popup
        setTimeout(function(){
            let aPreviewPostNumbers = getPostPreviewNums(workingElement);
            aPreviewPostNumbers.map( idNum => replacePostPreviewByNum(idNum) );
        }, 75); //minimize popup flicker
    };

    //Replace posts added by regular refresh on a single thread page
    const handleNewPosts = function(mutationsList, observer) {
        debugger;
        for(const mutation of mutationsList) {
            if (mutation.type === 'attributes' || mutation.type === 'characterData') {
                console.log('Mutation in handleNewPosts, Something was modified.');
            } else if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                //here comes a DIV without ID. need to go deeper one level firstElementChild will be DIV with ID
                console.log('Mutation in handleNewPosts, children added: ' + mutation.addedNodes.length);
                var aPostNums = [];
                aPostNums = getElementNumsFromParent('div.thread__post', mutation.addedNodes[0]);
                aPostNums.map(idNum => replaceArticleByNum(idNum) );
            }
        }
    }

    var workingElement;
    var aInitialPostNums = [];
    
    // main

    workingElement = aThreads[0].parentElement;
    aInitialPostNums = getArticleNums(workingElement);
    aInitialPostNums.map(idNum => replaceArticleByNum(idNum) );

    if (workingElement.nodeName === 'DIV' && workingElement.hasAttribute('id') && workingElement.id === 'posts-form') {
        const board_observer = new MutationObserver(handleScrollAndPopup);
        board_observer.observe(workingElement, {childList:true}); //todo try smthAdded param
    }
    if (aThreads.length == 1) {
        debugger;
        //on a single thread page we need one more observer for added posts
        const thread_observer = new MutationObserver(handleNewPosts);
        thread_observer.observe(aThreads[0], {childList:true}); //todo try smthAdded param
    }

})();
