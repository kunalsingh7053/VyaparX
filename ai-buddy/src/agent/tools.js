const { tool } = require("@langchain/core/tools")
const { z } = require("zod")
const axios = require("axios")
const searchProduct = tool(async (data) => {
    const response = await axios.get(`http://localhost:3001/api/products`)
},{
    name: "search_product",
    description:"search for  product  based on query",
    inputSchema: z.object({
        query: z.string().describe("the search query for the product")
    })
})