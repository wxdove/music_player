from flask import Flask, render_template, jsonify, request
import os
from crawler import wyy_music
from  crawler import kg_music
from flask_cors import CORS
app = Flask(__name__)
CORS(app)
# 基础配置
app.config.update({
    'TEMPLATES_AUTO_RELOAD': True,
    'SEND_FILE_MAX_AGE_DEFAULT': 0
})


@app.route('/')
def index():
    """主页面路由"""
    return render_template('index.html')

@app.route('/search1')
def search_api_wyy():
    """搜索接口"""
    query = request.args.get('q', '')
    if not query:
        return jsonify([])
    try:
        # 调用你的爬虫函数
        result = wyy_music.search_music(query)
        return jsonify(result)
    except Exception as e:
        app.logger.error(f'搜索失败: {str(e)}')
        return jsonify({'error': '搜索服务暂不可用'}), 500

@app.route('/search2')
def search_api_kg():
    """搜索接口"""
    query = request.args.get('q', '')
    if not query:
        return jsonify([])
    try:
        # 调用你的爬虫函数
        result = kg_music.fetch_music(query)
        return jsonify(result)
    except Exception as e:
        app.logger.error(f'搜索失败: {str(e)}')
        return jsonify({'error': '搜索服务暂不可用'}), 500

if __name__ == '__main__':
    app.static_folder = os.path.abspath('static')
    app.template_folder = os.path.abspath('templates')
    app.run(host='0.0.0.0', port=5000, debug=True)