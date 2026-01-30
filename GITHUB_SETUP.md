# 上传到 GitHub 并与同事协作

## 一、准备工作

### 1. 安装 Git

如果还没安装，请到 [git-scm.com](https://git-scm.com/downloads) 下载安装。

### 2. 配置 Git（首次使用）

```powershell
git config --global user.name "你的名字"
git config --global user.email "你的邮箱@example.com"
```

### 3. GitHub 账号

到 [github.com](https://github.com) 注册账号（如已有则跳过）。

---

## 二、在 GitHub 上创建仓库

1. 登录 GitHub，点击右上角 **+** → **New repository**
2. 填写：
   - **Repository name**：`tetris`（或自定义名称）
   - **Description**：可选，如「俄罗斯方块小游戏」
   - 选择 **Public**
   - **不要**勾选 "Add a README"（本地已有）
3. 点击 **Create repository**

---

## 三、在本地初始化并推送

在 **PowerShell** 或 **命令提示符** 中执行（路径按你的实际项目位置修改）：

```powershell
# 1. 进入项目目录
cd "f:\OneDrive\2-学习\02 硕士\00-coding\tetris"

# 2. 初始化 Git
git init

# 3. 添加所有文件
git add .

# 4. 第一次提交
git commit -m "Initial commit: 俄罗斯方块游戏"

# 5. 重命名默认分支为 main（如已是 main 可跳过）
git branch -M main

# 6. 添加远程仓库（替换成你自己的 GitHub 仓库地址）
git remote add origin https://github.com/你的用户名/tetris.git

# 7. 推送到 GitHub
git push -u origin main
```

第 6 步的仓库地址在 GitHub 新建仓库页面的绿色 **Code** 按钮里复制。

---

## 四、邀请同事协作

1. 打开你的 GitHub 仓库
2. 点击 **Settings** → **Collaborators**
3. 点击 **Add people**
4. 输入同事的 GitHub 用户名或邮箱，发送邀请
5. 同事接受邀请后，就可以克隆、修改、推送代码

---

## 五、同事如何参与开发

同事在收到邀请后：

```powershell
# 克隆项目
git clone https://github.com/你的用户名/tetris.git
cd tetris

# 创建自己的分支进行开发
git checkout -b feature/新功能

# 修改代码后提交
git add .
git commit -m "添加 xxx 功能"

# 推送到远程
git push origin feature/新功能
```

然后在 GitHub 上发起 **Pull Request**，由你审核后合并到 `main`。

---

## 六、常用命令速查

| 操作         | 命令                         |
|--------------|------------------------------|
| 拉取最新代码 | `git pull origin main`       |
| 查看状态     | `git status`                 |
| 查看修改     | `git diff`                   |
| 切换分支     | `git checkout 分支名`        |
| 创建并切换   | `git checkout -b 新分支名`   |

---

## 七、遇到 HTTPS 推送需要登录时

- 推荐使用 **GitHub CLI**：`gh auth login`
- 或使用 **Personal Access Token**：GitHub → Settings → Developer settings → Personal access tokens → 生成 token，在提示密码时输入 token
