/**
 * 解析 SSE 流，逐个 yield 解析后的 JSON 对象
 * @param {Response} response fetch 响应对象
 */
export async function* parseSSE(response) {
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() // 保留不完整的最后一行

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          yield JSON.parse(line.slice(6))
        } catch {
          // 忽略解析失败的行
        }
      }
    }
  }
}
