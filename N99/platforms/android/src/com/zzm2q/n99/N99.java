/*
       Licensed to the Apache Software Foundation (ASF) under one
       or more contributor license agreements.  See the NOTICE file
       distributed with this work for additional information
       regarding copyright ownership.  The ASF licenses this file
       to you under the Apache License, Version 2.0 (the
       "License"); you may not use this file except in compliance
       with the License.  You may obtain a copy of the License at

         http://www.apache.org/licenses/LICENSE-2.0

       Unless required by applicable law or agreed to in writing,
       software distributed under the License is distributed on an
       "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
       KIND, either express or implied.  See the License for the
       specific language governing permissions and limitations
       under the License.
 */

package com.zzm2q.n99;

import org.apache.cordova.Config;
import org.apache.cordova.CordovaActivity;

import android.os.Bundle;
import android.util.Log;
import android.view.ViewGroup;
import android.widget.RelativeLayout;

import com.adsmogo.adapters.AdsMogoCustomEventPlatformEnum;
import com.adsmogo.adview.AdsMogoLayout;
import com.adsmogo.controller.listener.AdsMogoListener;

public class N99 extends CordovaActivity implements AdsMogoListener {

	private AdsMogoLayout adsMogoView;

	@Override
	public void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		super.init();
		// Set by <content src="index.html" /> in config.xml
		super.loadUrl(Config.getStartUrl());
		// super.loadUrl("file:///android_asset/www/index.html");

		adsMogoView = new AdsMogoLayout(this, "0402f1ce68564654928e91dba2bae446");
		/**
		 * step2,设置监听
		 * 参数：为AdsMogoListener
		 */
		adsMogoView.setAdsMogoListener(this);
		
		/**
		 * step3,添加adsMogoView到指定的view中
		 */
		RelativeLayout parentLayput = new RelativeLayout(this);
		RelativeLayout.LayoutParams parentLayputParams = new RelativeLayout.LayoutParams(
				RelativeLayout.LayoutParams.MATCH_PARENT,
				RelativeLayout.LayoutParams.MATCH_PARENT);
		RelativeLayout.LayoutParams layoutParams = new RelativeLayout.LayoutParams(
				RelativeLayout.LayoutParams.MATCH_PARENT,
				RelativeLayout.LayoutParams.WRAP_CONTENT);		
		layoutParams.addRule(RelativeLayout.ALIGN_PARENT_BOTTOM,
				RelativeLayout.TRUE);
		parentLayput.addView(adsMogoView, layoutParams);
		
		addContentView(parentLayput, parentLayputParams);

	}

	@Override
	public void onDestroy() {
		AdsMogoLayout.clear();
		adsMogoView.clearThread();
		super.onDestroy();
	}

	@Override
	public Class getCustomEvemtPlatformAdapterClass(AdsMogoCustomEventPlatformEnum arg0) {
		return null;
	}

	@Override
	public void onClickAd(String arg0) {
		
	}

	@Override
	public boolean onCloseAd() {
		return false;
	}

	@Override
	public void onCloseMogoDialog() {
		
	}

	@Override
	public void onFailedReceiveAd() {
		Log.d("Ads", "接受广告失败");
	}

	@Override
	public void onRealClickAd() {
		// TODO Auto-generated method stub
	}

	@Override
	public void onReceiveAd(ViewGroup arg0, String arg1) {
		Log.d("Ads", "接受广告");
	}

	@Override
	public void onRequestAd(String arg0) {
		Log.d("Ads", "请求广告");
	}
}
