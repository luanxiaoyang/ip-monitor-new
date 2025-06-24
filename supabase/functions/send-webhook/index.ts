interface WebhookRequest {
  webhookUrl: string;
  card: any;
  simpleMessage?: any;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

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

    const { webhookUrl, card, simpleMessage }: WebhookRequest = await req.json();

    if (!webhookUrl) {
      return new Response(
        JSON.stringify({ error: "Missing webhookUrl in request body" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    console.log('Sending webhook to:', webhookUrl);

    let success = false;
    let lastError = null;
    let responseData = null;

    // 首先尝试发送卡片格式
    if (card) {
      try {
        console.log('Trying card format:', JSON.stringify(card, null, 2));
        
        const cardResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(card)
        });

        console.log('Card response status:', cardResponse.status);
        console.log('Card response ok:', cardResponse.ok);

        const cardResponseText = await cardResponse.text();
        console.log('Card response body:', cardResponseText);

        if (cardResponse.ok) {
          success = true;
          responseData = {
            method: 'card',
            status: cardResponse.status,
            body: cardResponseText
          };
        } else {
          lastError = `Card format failed: ${cardResponse.status} ${cardResponseText}`;
          console.log('Card format failed:', lastError);
        }
      } catch (cardError) {
        lastError = `Card format error: ${cardError.message}`;
        console.log('Card format error:', cardError);
      }
    }

    // 如果卡片格式失败，尝试简单消息格式
    if (!success && simpleMessage) {
      try {
        console.log('Trying simple message format:', JSON.stringify(simpleMessage, null, 2));
        
        const simpleResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(simpleMessage)
        });

        console.log('Simple message response status:', simpleResponse.status);
        console.log('Simple message response ok:', simpleResponse.ok);

        const simpleResponseText = await simpleResponse.text();
        console.log('Simple message response body:', simpleResponseText);

        if (simpleResponse.ok) {
          success = true;
          responseData = {
            method: 'simple',
            status: simpleResponse.status,
            body: simpleResponseText
          };
        } else {
          lastError = `Simple message failed: ${simpleResponse.status} ${simpleResponseText}`;
          console.log('Simple message failed:', lastError);
        }
      } catch (simpleError) {
        lastError = `Simple message error: ${simpleError.message}`;
        console.log('Simple message error:', simpleError);
      }
    }

    if (success) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Webhook sent successfully",
          response: responseData
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    } else {
      throw new Error(lastError || 'All webhook formats failed');
    }

  } catch (error) {
    console.error('Failed to send webhook notification:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error occurred",
        stack: error instanceof Error ? error.stack : undefined
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