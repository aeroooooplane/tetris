# 协作开发指南

## 一、同事如何参与（克隆 → 修改 → 上传）

### 1. 把项目下载到本地

```powershell
git clone https://github.com/aeroooooplane/tetris.git
cd tetris
```

### 2. 用浏览器打开 `index.html` 查看效果

### 3. 修改代码（见下方「修改哪些文件」）

### 4. 提交并推送

```powershell
git add .
git commit -m "描述你的修改"
git push origin main
```

> 首次推送需在 GitHub 仓库 → Settings → Collaborators 中邀请同事加入。

---

## 二、修改哪些文件

| 想修改的内容 | 编辑的文件 | 说明 |
|-------------|-----------|------|
| **外观（颜色、布局、字体等）** | `style.css` | 所有样式都在这里，改这个就够 |
| **页面结构（按钮、文字、新区域）** | `index.html` | 增加或调整页面元素 |
| **游戏逻辑（规则、计分、操作）** | `main.js` | 玩法、按键、下落速度等 |

**一般不建议改：** `.gitignore`、`CONTRIBUTING.md`、`GITHUB_SETUP.md`（除非你清楚用途）

---

## 三、推荐工作流（多人同时改时）

1. **创建分支**：修改前先创建自己的分支
   ```bash
   git checkout -b feature/新功能名称
   ```

2. **修改代码**：在本地编辑并测试

3. **提交更改**
   ```bash
   git add .
   git commit -m "描述你的修改"
   ```

4. **推送到远程**
   ```bash
   git push origin feature/新功能名称
   ```

5. **发起 Pull Request**：在 GitHub 上创建 PR，请同事审核后合并

## 拉取他人更新

```bash
git checkout main
git pull origin main
```

## 合并主分支到你的分支（减少冲突）

```bash
git checkout feature/你的分支
git merge main
```
