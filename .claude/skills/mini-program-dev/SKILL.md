---
name: mini-program-dev
description: WeChat Mini Program development - structure, pages, cloud development. Use when building or modifying WeChat Mini Programs.
---

## WeChat Mini Program Development Skill

Expertise in WeChat Mini Program (微信小程序) development:

### 1. Project Structure

```
mini-program/
├── app.js                 # App entry, global lifecycle
├── app.json               # Global config (pages, window, tabBar)
├── app.wxss               # Global styles
├── pages/                 # Page directory
│   ├── index/
│   │   ├── index.js       # Page logic
│   │   ├── index.json     # Page config
│   │   ├── index.wxml     # Page template
│   │   └── index.wxss     # Page styles
│   └── ...
├── components/            # Custom components
├── utils/                 # Utility functions
├── cloudfunctions/        # Cloud functions (if using cloud dev)
├── images/                # Image assets
├── project.config.json    # Project config
└── sitemap.json          # SEO config
```

### 2. Page Development

#### WXML Template (similar to HTML):
```xml
<view class="container">
  <view class="header">{{title}}</view>
  <view class="content">
    <block wx:for="{{list}}" wx:key="id">
      <view class="item" bindtap="onItemTap" data-id="{{item.id}}">
        <image src="{{item.image}}" mode="aspectFill" />
        <text>{{item.name}}</text>
      </view>
    </block>
  </view>
  <view class="footer">
    <button bindtap="onLoadMore" loading="{{loading}}">加载更多</button>
  </view>
</view>
```

#### WXSS Styles (similar to CSS):
```css
.container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f5f5f5;
}
.item {
  display: flex;
  align-items: center;
  padding: 20rpx;
  background: #fff;
  margin-bottom: 2rpx;
}
```

#### JS Page Logic:
```javascript
Page({
  data: {
    title: '首页',
    list: [],
    loading: false
  },

  onLoad(options) {
    this.fetchData();
  },

  onShow() {
    // Page shown (including back from navigate)
  },

  onPullDownRefresh() {
    this.fetchData().then(() => wx.stopPullDownRefresh());
  },

  onReachBottom() {
    this.loadMore();
  },

  async fetchData() {
    this.setData({ loading: true });
    try {
      const res = await wx.cloud.callFunction({ name: 'getList' });
      this.setData({ list: res.result.data });
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'error' });
    } finally {
      this.setData({ loading: false });
    }
  },

  onItemTap(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` });
  }
});
```

### 3. App Configuration (app.json)

```json
{
  "pages": [
    "pages/index/index",
    "pages/detail/detail",
    "pages/user/user"
  ],
  "window": {
    "navigationBarTitleText": "我的小程序",
    "navigationBarBackgroundColor": "#ffffff",
    "navigationBarTextStyle": "black"
  },
  "tabBar": {
    "list": [
      { "pagePath": "pages/index/index", "text": "首页", "iconPath": "images/home.png", "selectedIconPath": "images/home-active.png" },
      { "pagePath": "pages/user/user", "text": "我的", "iconPath": "images/user.png", "selectedIconPath": "images/user-active.png" }
    ]
  },
  "usingComponents": {}
}
```

### 4. Cloud Development (云开发)

#### Cloud Function:
```javascript
// cloudfunctions/getList/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { page = 1, pageSize = 20 } = event;
  try {
    const result = await db.collection('items')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .orderBy('createTime', 'desc')
      .get();
    return { code: 0, data: result.data };
  } catch (err) {
    return { code: -1, message: err.message };
  }
};
```

### 5. Custom Components

```javascript
// components/card/card.js
Component({
  properties: {
    title: String,
    image: String,
    desc: String
  },
  methods: {
    onTap() {
      this.triggerEvent('cardtap', { title: this.properties.title });
    }
  }
});
```

### 6. Key APIs
- **Navigation**: `wx.navigateTo`, `wx.redirectTo`, `wx.switchTab`, `wx.navigateBack`
- **Storage**: `wx.setStorageSync`, `wx.getStorageSync`
- **Network**: `wx.request`, `wx.uploadFile`, `wx.downloadFile`
- **UI**: `wx.showToast`, `wx.showModal`, `wx.showLoading`
- **Media**: `wx.chooseImage`, `wx.previewImage`, `wx.getLocation`

### 7. Best Practices
- Use `rpx` (responsive pixel) for sizing: 750rpx = screen width
- Keep `setData` calls minimal - only update changed fields
- Use custom components for reusable UI
- Implement lazy loading with `onReachBottom`
- Cache network data with Storage API
- Handle all error states gracefully
- Follow WeChat's design guidelines and review requirements

### Mini Program Checklist
- [ ] app.json configured correctly
- [ ] All pages registered in app.json
- [ ] Tab bar icons provided (40kb limit each)
- [ ] Request domains configured in admin panel
- [ ] Cloud environment initialized (if using cloud)
- [ ] Error handling on all async operations
- [ ] Pull-to-refresh implemented where needed
- [ ] Page scroll position restored (if needed)
- [ ] Mini program size under 2MB limit (main package)
- [ ] Subpackages configured for larger apps
