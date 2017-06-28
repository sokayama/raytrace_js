// まるぱくり
// http://techblog.sega.jp/entry/2017/06/26/100000
// CPUでレイトレース
(function(){

    var windowWidth;
    var windowHeight;

    // --*--*--*--*--*--*--*--*--*--
    // windowのサイズ変更したとき
    // --*--*--*--*--*--*--*--*--*--
    window.addEventListener("resize",function(){
        windowWidth = window.innerWidth;
        windowHeight = window.innerHeight;
        raytrace();
    });

    // --*--*--*--*--*--*--*--*--*--
    // windowのロード終わったとき
    // --*--*--*--*--*--*--*--*--*--
    window.addEventListener("load",function(){
        raytrace();
    });

    function raytrace() 
    {
        // 各種便利関数
        function setVec3( v, x, y, z )
        {
            v[0] = x; v[1] = y; v[2] = z;
        }
        function minus( a, b )
        {
            var ret = new Array(3);
            ret[0] = a[0] - b[0];
            ret[1] = a[1] - b[1];
            ret[2] = a[2] - b[2];
            return ret;
        }
        function dot( a, b )
        {
            return a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
        }
        function mad( a, m, b )
        {
            var ret = new Array(3);
            ret[0] = a[0] * m + b[0];
            ret[1] = a[1] * m + b[1];
            ret[2] = a[2] * m + b[2];
            return ret;
        }
        function length( v )
        {
            return Math.sqrt( dot(v,v) );
        }
        function normalize( v )
        {
            var len = length( v );
            v[0] /= len;
            v[1] /= len;
            v[2] /= len;
        }

        // キャンバス取得
        var elem = document.getElementById("raytracesample");

        windowWidth = window.innerWidth;
        windowHeight = window.innerHeight;

        elem.width = windowWidth;
        elem.height = windowHeight;
        var canvas = elem.getContext( "2d" );
        
        // クリア
        canvas.fillStyle = "rgb(94,150,200)";
        canvas.fillRect(0,0,windowWidth,windowHeight);

        // 目の場所は( 0, 0, 128 )
        var eye = new Array(3);
        setVec3( eye, 0, 0, 128 );
        
        // 球の場所は( 0, 0, -64 )、大きさは32
        var sphere_1 = new Array(3);
        setVec3( sphere_1, 0, 0, -64 );
        var sphere_1_size = 32;

        // 平行光
        var dlight = new Array(3);
        setVec3( dlight, 1, 2, 2 );
        normalize( dlight );
    
        // ピクセル数レイを飛ばす
        var ray = new Array(3);
        var screen = new Array(3);
        for( var y = 0; y < windowHeight; ++y )
        {
            for( var x = 0; x < windowWidth; ++x )
            {
                // スクリーンは(-31.5,-31.5,0)-(+31.5,+31.5,0)のXY平面
                setVec3( screen, x*0.25 - 31.5, 31.5 - y*0.25, 0 ); // ピクセルに対するスクリーン位置

                // 目からスクリーンへのベクトルをレイとする
                ray = minus( screen, eye ); 
                normalize( ray ); // 正規化

                // レイと球の当たり判定
                var v = minus( sphere_1, eye );
                var d = dot( v, ray );
                if( d > 0.0 )
                {
                    var p = mad( ray, d, eye );
                    v = minus( sphere_1, p );
                    var len = length( v );
                    if( len < sphere_1_size ) 
                    {
                        // 球に当たったので各種情報を求める
                        len = len / sphere_1_size;
                        d = Math.sqrt(-len*len + 1.0*1.0) * sphere_1_size;
                        // 衝突座標
                        p = mad( ray ,-d, p ); 
                        // 法線
                        var nrm = minus( p, sphere_1 ); 
                        normalize( nrm );
                        
                        // ライティング
                        d = Math.max( dot( nrm, dlight ), 0 );
                        
                        // 結果を描画
                        var col = Math.floor(255*d);
                        canvas.fillStyle = "rgb("+col+","+col+","+col+")";
                        canvas.fillRect( x, y, 1, 1 ); // 点を打つ機能がないのでfillRectで代用
                    }
                }
            }
        }
    }

}());