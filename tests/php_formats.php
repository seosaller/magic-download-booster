<?php
require $argv[1] . '/formats.php';
function check($condition, $rule) { if (!$condition) throw new RuntimeException($rule); }
function manifest($sizes) {
    $xml = '<MPD xmlns="urn:mpeg:dash:schema:mpd:2011"><Period><AdaptationSet mimeType="video/mp4">';
    foreach ($sizes as $size) $xml .= '<Representation width="'.$size[0].'" height="'.$size[1].'" bandwidth="100"><BaseURL>https://video.fbcdn.net/'.$size[1].'.mp4?a=1&amp;b=2</BaseURL></Representation>';
    $xml .= '</AdaptationSet><AdaptationSet mimeType="audio/mp4"><Representation bandwidth="192000"><BaseURL>https://video.fbcdn.net/audio.mp4</BaseURL></Representation></AdaptationSet></Period></MPD>';
    return json_encode(['dash_manifest'=>$xml]);
}
check(array_column(fbdl_select_formats(fbdl_native_streams(manifest([[2560,1440],[3840,2160]]))), 'quality') === ['2K','4K'], 'Show both when both native resolutions are available');
check(array_column(fbdl_select_formats(fbdl_native_streams(manifest([[2560,1440]]))), 'quality') === ['2K'], 'Keep 2K when 4K is unavailable');
check(fbdl_select_formats(fbdl_native_streams(manifest([[1920,1080]]))) === [], 'Never invent 2K/4K from HD');
check(array_column(fbdl_select_formats(fbdl_native_streams(manifest([[1440,2560],[2160,3840]]))), 'quality') === ['2K','4K'], 'Portrait reels use their shorter dimension');
check(fbdl_select_formats(['videos'=>[['width'=>3840,'height'=>2160,'bandwidth'=>1,'url'=>'https://video.fbcdn.net/v.mp4']], 'audio'=>null]) === [], 'Do not offer silent mux without audio');
check(!fbdl_media_url('https://fbcdn.net.evil.example/video.mp4'), 'Reject lookalike media hosts');
echo "PASS: native quality availability, no upscaling, portrait selection and audio pairing.\n";