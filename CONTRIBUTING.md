# 协作开发指南

## 克隆项目

```bash
git clone https://github.com/你的用户名/tetris.git
cd tetris
```

## 推荐工作流

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
