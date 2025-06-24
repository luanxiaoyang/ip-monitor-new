interface IPCheckRequest {
  ip: string;
  port: number;
  username: string;
  password: string;
}

interface IPCheckResponse {
  status: 'online' | 'offline' | 'error';
  response_time?: number;
  error?: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// 使用 SOCKS5 代理检测 IP 连接
async function checkIPWithSocks5(ip: string, port: number, username: string, password: string): Promise<IPCheckResponse> {
  const startTime = Date.now();
  
  try {
    // 构建 SOCKS5 代理 URL
    const proxyUrl = `socks5://${username}:${password}@${ip}:${port}`;
    
    // 使用代理请求外部 API 来测试连接
    const testUrl = 'https://api.ipify.org/';
    
    // 使用 curl 命令通过 SOCKS5 代理测试连接
    const curlCommand = [
      'curl',
      '-x', proxyUrl,
      '--connect-timeout', '10',
      '--max-time', '15',
      '--silent',
      '--show-error',
      testUrl
    ];

    const process = new Deno.Command('curl', {
      args: curlCommand.slice(1),
      stdout: 'piped',
      stderr: 'piped',
    });

    const { code, stdout, stderr } = await process.output();
    const responseTime = Date.now() - startTime;

    if (code === 0) {
      const output = new TextDecoder().decode(stdout);
      // 检查是否返回了有效的 IP 地址
      const ipRegex = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
      if (ipRegex.test(output.trim())) {
        return {
          status: 'online',
          response_time: responseTime
        };
      } else {
        return {
          status: 'offline',
          error: 'Invalid response from proxy'
        };
      }
    } else {
      const errorOutput = new TextDecoder().decode(stderr);
      return {
        status: 'offline',
        error: errorOutput || 'Connection failed'
      };
    }
  } catch (error) {
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      });
    }

    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        {
          status: 405,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    const { ip, port, username, password }: IPCheckRequest = await req.json();

    if (!ip || !port || !username || !password) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: ip, port, username, password" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    // 检测 IP 连接
    const result = await checkIPWithSocks5(ip, port, username, password);

    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );

  } catch (error) {
    console.error('IP check failed:', error);
    
    return new Response(
      JSON.stringify({ 
        status: 'error',
        error: error instanceof Error ? error.message : "Unknown error occurred" 
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }
});