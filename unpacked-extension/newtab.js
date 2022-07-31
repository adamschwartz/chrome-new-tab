'use strict';

const foldersOpen = {}

const bookmarksBarEl = document.getElementById('bookmarks-bar')
const otherBookmarksEl = document.getElementById('other-bookmarks')

function renderAll(nodes, target, toplevel) {
  var ul = document.createElement('ul')

  for (var i = 0; i < nodes.length; i++) {
    var node = nodes[i]
    render(node, ul)
  }

  if (ul.childNodes.length === 0) {
    render({ id: 'empty', className: 'empty', title: '(empty)' }, ul)
  }

  if (toplevel) {
    target.appendChild(ul)

  } else {
    var wrap = document.createElement('div')
    wrap.appendChild(ul)
    target.appendChild(wrap)
  }

  return ul
}

function render(node, target) {
  var li = document.createElement('li')
  var a = document.createElement('a')

  var url = node.url || node.appLaunchUrl
  if (url) a.href = url

  a.innerText = node.title || node.name || ''
  if (node.tooltip) a.title = node.tooltip

  setClass(a, node)

  a.insertBefore(getIcon(node), a.firstChild)

  if (url) {
    var items = getMenuItems(node)

    a.oncontextmenu = event => {
      renderMenu(items, event.pageX, event.pageY)
      return false
    }

    var urlStart = url.substring(0, 6)
    if (urlStart === 'chrome' || urlStart === 'file:/') {
      a.onclick = function(event) {
        openLink(node, event.metaKey)
        return false
      }
    }

  } else if (!node.children && !node.type) {
    a.style.pointerEvents = 'none'
  }

  li.appendChild(a)

  // Folders
  if (node.children) {
    a.onclick = function() {
      toggle(node, a, getChildrenFunction(node))
      return false
    }

    var items = getMenuItems(node)

    a.oncontextmenu = event => {
      renderMenu(items, event.pageX, event.pageY)
      return false
    }
  }

  target.appendChild(li)
  return li
}

function getMenuItems(node) {
  const items = []

  if (node.children) {
    items.push({
      label: 'Open all links in folder',
      action: () => {
        openLinks(node)
      }
    })

  } else {
    items.push({
      label: 'Open link in tab',
      action: () => {
        openLink(node, 1)
      }
    })
  }

  items.push({
    label: 'Edit bookmarks',
    action: () => {
      openLink({ url: 'chrome://bookmarks' }, 1)
    }
  })

  return items
}

function onMenuClick(item) {
  return function() {
    item.action()
    return false
  }
}

function renderMenu(items, x, y) {
  closeMenu()

  var ul = document.createElement('ul')
  ul.className = 'menu'

  for (var i = 0; i < items.length; i++) {
    var li = document.createElement('li')
    var a = document.createElement('a')
    a.setAttribute('tabindex', 0)
    a.innerText = items[i].label
    a.onclick = onMenuClick(items[i])
    li.appendChild(a)
    ul.appendChild(li)
  }

  document.body.appendChild(ul)

  ul.style.left = Math.max(Math.min(x, window.innerWidth + window.scrollX - ul.clientWidth), 0) + 'px'
  ul.style.top = Math.max(Math.min(y, window.innerHeight + window.scrollY - ul.clientHeight), 0) + 'px'

  ul.onmousedown = function(event) {
    event.stopPropagation()
    return true
  }

  return ul
}

document.onmousedown = function(event) {
  closeMenu()
}

document.onkeydown = function() {
  if (event.keyCode == 27) {
    closeMenu()
    closeOpenFolders()
  }
}

function closeMenu(ul) {
  const menu = document.querySelector('body > .menu')
  if (menu) menu.remove()
}

const closeOpenFolders = (scopeElement = document.body) => {
  const folders = scopeElement.querySelectorAll('.folder.open')
  Array.from(folders).reverse().forEach(folder => folder.click())
}

document.body.addEventListener('mousedown', event => {
  const closestFolder = event.target.closest('.folder')
  if (!closestFolder) {
    closeOpenFolders()
  } else {
    closeOpenFolders(closestFolder)
  }
})

function getChildrenFunction(node) {
  switch(node.id) {
    default:
      if (node.children)
        return function(callback) {
          callback(node.children)
        }
      else
        return function(callback) {
          chrome.bookmarks.getSubTree(node.id, function(result) {
            if (!result) return
            callback(result[0].children)
          })
        }
  }
}

function setClass(target, node, isOpen) {
  if (node.className) {
    target.classList.add(node.className)
  }

  if (node.children) {
    target.classList.add('folder')
    target.setAttribute('tabindex', 0)
  }

  if (isOpen) {
    target.classList.add('open')
  } else {
    target.classList.remove('open')
  }
}

function getIcon(node) {
  var url, url2x
  if (node.icons) {
    var size
    for (var i in node.icons) {
      var iconInfo = node.icons[i]
      if (iconInfo.url && (!size || (iconInfo.size < size && iconInfo.size > 15))) {
        url = iconInfo.url
        if (iconInfo.size > 31) url2x = iconInfo.url
        size = iconInfo.size
      }
    }
  } else if (node.icon)
    url = node.icon
  else if (node.url || node.appLaunchUrl) {
    // See https://bugs.chromium.org/p/chromium/issues/detail?id=104102
    const pageURL = node.url || node.appLaunchUrl
    url = `chrome-extension://${chrome.runtime.id}/_favicon/?pageUrl=${encodeURIComponent(pageURL)}&size=16`
    url2x = `chrome-extension://${chrome.runtime.id}/_favicon/?pageUrl=${encodeURIComponent(pageURL)}&size=32`
  }

  var icon = document.createElement(url ? 'img' : 'div')
  icon.className = 'icon'
  icon.src = url
  if (url2x) icon.srcset = url2x + ' 2x'
  icon.alt = ''
  return icon
}

// toggle folder open state
function toggle(node, a) {
  var isOpen = foldersOpen[node.id]
  setClass(a, node, !isOpen)
  a.open = !isOpen

  if (isOpen) {
    delete foldersOpen[node.id]
    if (a.nextSibling) {
      var children = (a.nextSibling.tagName == 'DIV' ? a.nextSibling.firstChild : a.nextSibling).children
      for (var i = 0; i < children.length; i++) {
        var child = children[i].firstChild
        if (child.open)
          child.onclick()
      }

      toggleOpenClose(node, a, isOpen)
    }

  } else {
    foldersOpen[node.id] = true

    var siblings = a.parentNode.parentNode.children
    for (var i = 0; i < siblings.length; i++) {
      var sibling = siblings[i].firstChild
      if (sibling != a && sibling.open)
        sibling.onclick()
    }

    if (a.nextSibling)
      toggleOpenClose(node, a, isOpen)

    else
      getChildrenFunction(node)(function(result) {
        if (!a.nextSibling && foldersOpen[node.id]) {
          renderAll(result, a.parentNode)
          toggleOpenClose(node, a, isOpen)
        }
      })
  }
}

function toggleOpenClose(node, a, isOpen) {
  var wrap = a.nextSibling
  wrap.className = 'wrap ' + (isOpen ? 'wrap-is-close' : 'wrap-is-open')
}

// opens immediate children of given node in new tabs
function openLinks(node) {
  chrome.tabs.getCurrent(function(tab) {
    getChildrenFunction(node)(function(result) {
      for (var i = 0; i < result.length; i++)
        openLink(result[i], 2)
    })
  })
}

// opens given node
function openLink(node, newtab) {
  var url = node.url || node.appLaunchUrl
  if (url) {
    chrome.tabs.getCurrent(function(tab) {
      if (newtab)
        chrome.tabs.create({url: url, active: (newtab == 1), openerTabId: tab.id})
      else
        chrome.tabs.update(tab.id, {url: url})
    })
  }
}

chrome.bookmarks.getTree(function(result) {
  var nodes = result[0].children

  const bookmarksBar = nodes[0]
  const otherBookmarks = nodes[1]

  if (bookmarksBar.children.length) {
    renderAll(bookmarksBar.children, bookmarksBarEl)
  } else {
    bookmarksBarEl.remove()
  }

  if (otherBookmarks.children.length) {
    renderAll([otherBookmarks], otherBookmarksEl)
  } else {
    otherBookmarksEl.remove()
  }
})
