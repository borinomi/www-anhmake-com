// Sections and Cards Data for ANHMAKE
window.sectionsData = {
  page: {
    title: "ANHMAKE",
    subtitle: "AI 자동화의 이해",
    url: "www.anhmake.com",
    icon: "logo.png"
  },
  sections: [
    {
      id: "tools",
      title: "도구",
      order: 1,
      cards: [
        {
          id: 1,
          type: "url",
          title: "Excel Tool",
          description: "Get ready to go home with Excel tools.",
          icon: "./excel/logo_Excel.png",
          url: "./excel/",
          created_at: "2025-09-06"
        },
        {
          id: 2,
          type: "dashboard", 
          title: "n8n Resource Board",
          description: "View and copy n8n workflow-related code and system messages.",
          icon: "./n8n/logo_n8n.png",
          dashboard_id: "n8n-board",
          created_at: "2025-09-06"
        },
        {
          id: 3,
          type: "url",
          title: "GPM - Chrome Extension", 
          description: "Chrome extension for Facebook group post management.",
          icon: "./gpm/logo.png",
          url: "https://gpm.anhmake.com",
          created_at: "2025-09-06"
        },
        {
          id: 4,
          type: "url",
          title: "GPM2 - Web application",
          description: "Facebook group post automation system.",
          icon: "./gpm/logo.png", 
          url: "https://gpm2.anhmake.com",
          created_at: "2025-09-06"
        }
      ]
    }
  ]
};