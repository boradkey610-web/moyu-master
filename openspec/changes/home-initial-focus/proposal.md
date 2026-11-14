# 首页刷新不自动点亮主按钮焦点

## Why
刚刷新首页时show自动聚焦第一个按钮，home-start命中focus-visible，多出一圈灰绿外框，和按钮原描边阴影叠加。

## What Changes
首页初始聚焦dialog容器，避免默认主按钮的键盘外框；保留实际Tab导航及其他弹窗首按钮焦点。

## Impact
src/app.js与style.css，纯首页焦点修复，不改变玩法或点击操作。
