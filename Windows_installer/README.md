# Windows_installer / Windows 安装包

本目录存放**本 fork（[nimingming1135/EasyPDM](https://github.com/nimingming1135/EasyPDM)）**编译出的
简体中文 Windows 安装程序。

> 与上游 `EasyPDM/EasyPDM` 不同：本 fork 的安装向导、Web 界面、以及 FreeCAD /
> SolidWorks / Inventor 三个 CAD 宏都已内置简体中文，并且**默认即为中文**。

## 文件

| 文件 | 说明 |
| --- | --- |
| `EasyPDM_Windows_v0.8.exe` | 完整安装包（自包含 .NET 10 运行时，无需另装 .NET） |
| `SHA256SUMS.txt` | 校验值，下载后可核对 |

## 安装前必须准备

安装程序**不会**替你在机器上装 PostgreSQL，需要先自行安装：

1. 安装 **PostgreSQL 18**（16/17 也可，推荐 18）：<https://www.postgresql.org/download/windows/>
2. 记住超级用户 `postgres` 的密码 —— 安装 EasyPDM 时只问一次，用来创建 EasyPDM 自己的角色和数据库，不会被保存。

## 安装

1. 双击 `EasyPDM_Windows_v0.8.exe`，安装向导第一步即可选择 **中文（简体）**。
2. 在「连接 PostgreSQL」页面填入 `postgres` 超级用户的密码。
3. 安装完成后，桌面／开始菜单的 **EasyPDM** 图标会打开 <http://localhost:5000>。
4. 首次登录：`admin` / `admin` —— **请立即在 设置 → 用户 里改掉密码**。

安装程序会：

- 创建独立角色与数据库 `easypdm`（**不会**动你已有的 `pdm` / `pdm_user` 开发库）；
- 把程序装到 `C:\Program Files\EasyPDM`；
- 把数据（文件存储、备份、日志）放到 `C:\ProgramData\EasyPDM`；
- 注册并启动 Windows 服务 **EasyPDM**（后台运行，无控制台窗口）。

## 升级

直接运行新版安装程序即可原地升级：不会重新询问 `postgres` 密码，也不会改动角色密码，
数据库迁移由程序启动时自动完成。

> 不支持「用旧版安装包覆盖新版」——数据库迁移只向前，安装程序会拒绝并说明原因。

## 卸载

控制面板卸载即可。**数据库和 `C:\ProgramData\EasyPDM` 会被刻意保留**（那是你的数据）。
如需一并删除，卸载结束时会给出具体命令：用 `psql` 删除数据库与角色，再删除该目录。

## 自己重新编译

```powershell
# 1. 前端（产物会写进 EasyPDM.Api/wwwroot，仓库里已提交，改了前端就必须重建）
cd EasyPDM.Web
npm ci
npm run build

# 2. 后端（自包含单文件 win-x64）
cd ..
dotnet publish EasyPDM.Api -c Release -r win-x64 --self-contained true `
    -p:PublishSingleFile=true -o packaging/windows/publish

# 3. 编译安装程序（需 Inno Setup >= 6.3，见下）
& "$env:LOCALAPPDATA\Programs\Inno Setup 6\ISCC.exe" packaging\windows\EasyPDM.iss
```

产物在 `packaging\windows\Output\EasyPDM_Windows_v0.8.exe`，复制到本目录即可。

### 编译环境要求

- **.NET 10 SDK**（自包含发布会下载 win-x64 运行时包，首次约 150 MB）
- **Inno Setup ≥ 6.3**
  中文向导用的是随仓库提供的 `packaging/windows/languages/ChineseSimplified.isl`，
  它是 6.5.0+ 的官方消息文件且以「无 BOM 的 UTF-8」保存——无 BOM 的 UTF-8 从 6.3 起才被识别。
  用 6.2 或更旧的编译器会读到乱码。**注意：Inno Setup 6.7.3 仍未内置中文**，所以本仓库自带该文件。

## 版本

- 应用版本：`0.8`（见 `EasyPDM.Web/src/version.ts` 与 `packaging/windows/EasyPDM.iss` 的 `MyAppVersion`，两处必须一致）
