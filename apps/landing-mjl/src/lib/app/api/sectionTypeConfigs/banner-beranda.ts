const exampleStructure = [
  {
    type: "content",
    fields: ["media", "title", "description"]
  },
  {
    type: "gallery",
    fields: ["title", "description"]
  },
  {
    type: "section",
    children: [
      {
        type: "content",
        fields: ["media", "title", "description"]
      },
      {
        type: "gallery",
        fields: ["title", "description"]
      }
    ]
  },
  {
    type: "sectionGroup",
    sectionGroupStructure: [
      {
        type: "content",
        fields: ["media", "title", "description"]
      },
      {
        type: "gallery",
        fields: ["title", "description"]
      },
    ]
  }
]