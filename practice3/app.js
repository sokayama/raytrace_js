(function(){
	var cameraState = {
		rotate : {
			x:0.0,
			y:0.0
		},
		target : {
			x:0.0,
			y:0.0,
			z:0.0
		}
	}

    var windowWidth;
    var windowHeight;

    // --*--*--*--*--*--*--*--*--*--
    // windowのサイズ変更したとき
    // --*--*--*--*--*--*--*--*--*--
    window.addEventListener("resize",function(){
		c.width = window.innerWidth;
		c.height = window.innerHeight;
    });

    window.addEventListener("load",function(){
		// - canvas と WebGL コンテキストの初期化 -------------------------------------
		// canvasエレメントを取得
		c = document.getElementById('canvas');

		// canvasのサイズをスクリーン全体に広げる
		c.width = window.innerWidth;
		c.height = window.innerHeight;

		//タッチするボタン
		function zoomButton(){
			data.buttonStatus = BUTTON_STATUS.LENS;
		}
		function homeButton(){
			data.buttonStatus = BUTTON_STATUS.HOME;
		}
		function freeButton(){
			data.buttonStatus = BUTTON_STATUS.FREE;
		}
		// function onClick(e) {
		// 	var x = e.clientX;
		// 	var y = e.clientY;
		// 	if(x < 490){
		// 		 console.log("clicked zoom",x);
		// 		zoomButton();
		// 	}
		// 	else
		// 	{
		// 		 console.log("clicked reset",x);
		// 		homeButton();
		// 	}
		// }
		// c.addEventListener("click",onClick,false);

		c.addEventListener("touchstart",function(eve){
			var x = eve.pageX;
			if(x < 490){
				console.log("touchstart zoom",x);
				zoomButton();
			}
			else
			{
				console.log("touchstart home",x);
				homeButton();
			}
			
		},false);
		c.addEventListener("touchend",function(eve){
			console.log("touch end");
			freeButton();
		},false);

		// webglコンテキストを取得
		gl = c.getContext('webgl') || c.getContext('experimental-webgl');


		// - シェーダとプログラムオブジェクトの初期化 ---------------------------------
		// シェーダのソースを取得
		vs = document.getElementById('vs').textContent;
		fs = document.getElementById('fs').textContent;
		
		// 頂点シェーダとフラグメントシェーダの生成
		var vShader = create_shader(vs, gl.VERTEX_SHADER);
		var fShader = create_shader(fs, gl.FRAGMENT_SHADER);

		// プログラムオブジェクトの生成とリンク
		var prg = create_program(vShader, fShader);


		// - 頂点属性に関する処理 -----------------------------------------------------
		// attributeLocationの取得
		var attLocation = {};
		attLocation[0] = gl.getAttribLocation(prg, 'position');
		attLocation[1] = gl.getAttribLocation(prg, "textureCoord");

		// attributeの要素数
		var attStride = {};
		attStride[0] = 3;
		attStride[1] = 2;

		// 板ポリモデル(頂点)データ
		var vPosition = [
			1.0,   1.0,  0.0,
			1.0,  -1.0,  0.0,
			-1.0,  -1.0,  0.0,
			-1.0,	  1.0,  0.0
		];
		var textureCoord = [
			1.0,0.0,
			1.0,1.0,
			0.0,1.0,
			0.0,0.0
		];

		// 頂点インデックス
		var index = [
			0, 2, 1,
			0, 3, 2
		];


		// VBOの生成
		var attVBO = {};
		attVBO[0] = create_vbo(vPosition);
		attVBO[1] = create_vbo(textureCoord);

		// VBOをバインド
		set_attribute(attVBO, attLocation, attStride);

		var ibo = create_ibo(index);

		// IBOをバインド
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);

		// create_texture("black.png",0);
		// uniform の場所をセット
		var loc_eye = gl.getUniformLocation(prg, "eye");
		var loc_at  = gl.getUniformLocation(prg, "at");
		var loc_up  = gl.getUniformLocation(prg, "up");

		var screen_size = gl.getUniformLocation(prg, "screen_size");
		
		// uniform に画面サイズの初期値セット
		gl.uniform2fv(screen_size,
			[
				c.width,
				c.height
			]
		);
		var config = gl.getUniformLocation(prg, "config");
		
		// uniform に画面サイズの初期値セット
		gl.uniform2fv(screen_size,
			[
				c.width,
				c.height
			]
		);

		timerFunc();

		function timerFunc(){
			gl.uniform4fv(config,
				[
					0,
					0,
					0,
					0
				]
			);


			// - レンダリングのための WebGL 初期化設定 ------------------------------------
			// ビューポートを設定する
			gl.viewport(0, 0, c.width, c.height);

			// canvasを初期化する色を設定する
			gl.clearColor(0.0, 0.0, 0.0, 1.0);

			// canvasを初期化する際の深度を設定する
			gl.clearDepth(1.0);

			// canvasを初期化
			gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

			// targetを設定
			gl.uniform3fv(loc_at,
				[
					cameraState.target.x,
					cameraState.target.y,
					cameraState.target.z
				]
			);
			// - レンダリング -------------------------------------------------------------
			// モデルの描画
			// gl.bindTexture(gl.TEXTURE_2D,texture[0]);

			//gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
			gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0);
			// コンテキストの再描画
			gl.flush();

			requestAnimationFrame(timerFunc);	
		}


	});




	// - 各種ユーティリティ関数 ---------------------------------------------------
	/**
	 * シェーダを生成する関数
	 * @param {string} source シェーダのソースとなるテキスト
	 * @param {number} type シェーダのタイプを表す定数 gl.VERTEX_SHADER or gl.FRAGMENT_SHADER
	 * @return {object} 生成に成功した場合はシェーダオブジェクト、失敗した場合は null
	 */
	function create_shader(source, type){
		// シェーダを格納する変数
		var shader;
		
		// シェーダの生成
		shader = gl.createShader(type);
		
		// 生成されたシェーダにソースを割り当てる
		gl.shaderSource(shader, source);
		
		// シェーダをコンパイルする
		gl.compileShader(shader);
		
		// シェーダが正しくコンパイルされたかチェック
		if(gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
			
			// 成功していたらシェーダを返して終了
			return shader;
		}else{
			
			// 失敗していたらエラーログをアラートする
			alert(gl.getShaderInfoLog(shader));
			
			// null を返して終了
			return null;
		}
	}

	/**
	 * プログラムオブジェクトを生成しシェーダをリンクする関数
	 * @param {object} vs 頂点シェーダとして生成したシェーダオブジェクト
	 * @param {object} fs フラグメントシェーダとして生成したシェーダオブジェクト
	 * @return {object} 生成に成功した場合はプログラムオブジェクト、失敗した場合は null
	 */
	function create_program(vs, fs){
		// プログラムオブジェクトの生成
		var program = gl.createProgram();
		
		// プログラムオブジェクトにシェーダを割り当てる
		gl.attachShader(program, vs);
		gl.attachShader(program, fs);
		
		// シェーダをリンク
		gl.linkProgram(program);
		
		// シェーダのリンクが正しく行なわれたかチェック
		if(gl.getProgramParameter(program, gl.LINK_STATUS)){
		
			// 成功していたらプログラムオブジェクトを有効にする
			gl.useProgram(program);
			
			// プログラムオブジェクトを返して終了
			return program;
		}else{
			
			// 失敗していたらエラーログをアラートする
			alert(gl.getProgramInfoLog(program));
			
			// null を返して終了
			return null;
		}
	}

	/**
	 * VBOを生成する関数
	 * @param {Array.<number>} data 頂点属性を格納した一次元配列
	 * @return {object} 頂点バッファオブジェクト
	 */
	function create_vbo(data){
		// バッファオブジェクトの生成
		var vbo = gl.createBuffer();
		
		// バッファをバインドする
		gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
		
		// バッファにデータをセット
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
		
		// バッファのバインドを無効化
		gl.bindBuffer(gl.ARRAY_BUFFER, null);
		
		// 生成した VBO を返して終了
		return vbo;
	}

	/**
	 * IBOを生成する関数
	 * @param {Array.<number>} data 頂点インデックスを格納した一次元配列
	 * @return {object} インデックスバッファオブジェクト
	 */
	function create_ibo(data){
		// バッファオブジェクトの生成
		var ibo = gl.createBuffer();
		
		// バッファをバインドする
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
		
		// バッファにデータをセット
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(data), gl.STATIC_DRAW);
		
		// バッファのバインドを無効化
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
		
		// 生成したIBOを返して終了
		return ibo;
	}

	/**
	 * VBOをバインドし登録する関数
	 * @param {object} vbo 頂点バッファオブジェクト
	 * @param {Array.<number>} attribute location を格納した配列
	 * @param {Array.<number>} アトリビュートのストライドを格納した配列
	 */
	function set_attribute(vbo, attL, attS){
		// 引数として受け取った配列を処理する
		for(var i in vbo){
			// バッファをバインドする
			gl.bindBuffer(gl.ARRAY_BUFFER, vbo[i]);
			
			// attributeLocationを有効にする
			gl.enableVertexAttribArray(attL[i]);
			
			// attributeLocationを通知し登録する
			gl.vertexAttribPointer(attL[i], attS[i], gl.FLOAT, false, 0, 0);
		}
	}


	/**
	 * テクスチャを生成する関数
	 * @param {string} source テクスチャに適用する画像ファイルのパス
	 */
	function create_texture(source,num){
		// イメージオブジェクトの生成
		var img = new Image();

		// データのオンロードをトリガーにする
		img.onload = function(){
			// テクスチャオブジェクトの生成
			var tex = gl.createTexture();
			
			// テクスチャをバインドする
			gl.bindTexture(gl.TEXTURE_2D, tex);
			
			// テクスチャへイメージを適用
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
			
			//テクスチャパラメータ
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

			// ミップマップを生成
			// gl.generateMipmap(gl.TEXTURE_2D);
			
			// テクスチャのバインドを無効化
			gl.bindTexture(gl.TEXTURE_2D, null);
			
			// 生成したテクスチャを変数に代入
			texture[num] = tex;
			console.log("texture",texture[num]);
		};

		// イメージオブジェクトのソースを指定
		img.src = source;
					console.log("create_texture",img.src);

	}
}());