namespace TCCControleDeAcesso.Views
{
    partial class frmConfiguracoes
    {
        /// <summary>
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        /// Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        /// <summary>
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            this.bntConectar = new System.Windows.Forms.Button();
            this.progressBarConectado = new System.Windows.Forms.ProgressBar();
            this.label1 = new System.Windows.Forms.Label();
            this.comboBoxPortas = new RJCodeAdvance.RJControls.RJComboBox();
            this.SuspendLayout();
            // 
            // bntConectar
            // 
            this.bntConectar.BackColor = System.Drawing.SystemColors.ControlLightLight;
            this.bntConectar.FlatStyle = System.Windows.Forms.FlatStyle.Popup;
            this.bntConectar.Font = new System.Drawing.Font("Arial", 15.75F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.bntConectar.Location = new System.Drawing.Point(80, 81);
            this.bntConectar.Margin = new System.Windows.Forms.Padding(4);
            this.bntConectar.Name = "bntConectar";
            this.bntConectar.Size = new System.Drawing.Size(228, 39);
            this.bntConectar.TabIndex = 0;
            this.bntConectar.Text = "Conectar";
            this.bntConectar.UseVisualStyleBackColor = false;
            this.bntConectar.Click += new System.EventHandler(this.bntConectar_Click);
            // 
            // progressBarConectado
            // 
            this.progressBarConectado.Location = new System.Drawing.Point(80, 168);
            this.progressBarConectado.Margin = new System.Windows.Forms.Padding(4);
            this.progressBarConectado.MarqueeAnimationSpeed = 0;
            this.progressBarConectado.Name = "progressBarConectado";
            this.progressBarConectado.Size = new System.Drawing.Size(228, 39);
            this.progressBarConectado.Step = 100;
            this.progressBarConectado.TabIndex = 1;
            // 
            // label1
            // 
            this.label1.AutoSize = true;
            this.label1.Font = new System.Drawing.Font("Arial", 15.75F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.label1.Location = new System.Drawing.Point(76, 53);
            this.label1.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.label1.Name = "label1";
            this.label1.Size = new System.Drawing.Size(232, 24);
            this.label1.TabIndex = 3;
            this.label1.Text = "Conexão com o Arduino";
            this.label1.TextAlign = System.Drawing.ContentAlignment.MiddleCenter;
            // 
            // comboBoxPortas
            // 
            this.comboBoxPortas.BackColor = System.Drawing.Color.WhiteSmoke;
            this.comboBoxPortas.BorderColor = System.Drawing.Color.DodgerBlue;
            this.comboBoxPortas.BorderSize = 2;
            this.comboBoxPortas.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
            this.comboBoxPortas.Font = new System.Drawing.Font("Microsoft Sans Serif", 10F);
            this.comboBoxPortas.ForeColor = System.Drawing.Color.DimGray;
            this.comboBoxPortas.IconColor = System.Drawing.Color.DodgerBlue;
            this.comboBoxPortas.ListBackColor = System.Drawing.Color.FromArgb(((int)(((byte)(230)))), ((int)(((byte)(228)))), ((int)(((byte)(245)))));
            this.comboBoxPortas.ListTextColor = System.Drawing.Color.DimGray;
            this.comboBoxPortas.Location = new System.Drawing.Point(80, 127);
            this.comboBoxPortas.MinimumSize = new System.Drawing.Size(200, 30);
            this.comboBoxPortas.Name = "comboBoxPortas";
            this.comboBoxPortas.Padding = new System.Windows.Forms.Padding(2);
            this.comboBoxPortas.Size = new System.Drawing.Size(228, 34);
            this.comboBoxPortas.TabIndex = 106;
            this.comboBoxPortas.Texts = "";
            // 
            // frmConfiguracoes
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(9F, 18F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.BackColor = System.Drawing.SystemColors.ControlLightLight;
            this.ClientSize = new System.Drawing.Size(384, 261);
            this.Controls.Add(this.comboBoxPortas);
            this.Controls.Add(this.label1);
            this.Controls.Add(this.bntConectar);
            this.Controls.Add(this.progressBarConectado);
            this.Font = new System.Drawing.Font("Arial", 12F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.Margin = new System.Windows.Forms.Padding(4);
            this.Name = "frmConfiguracoes";
            this.StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen;
            this.ResumeLayout(false);
            this.PerformLayout();

        }

        #endregion

        private System.Windows.Forms.Button bntConectar;
        private System.Windows.Forms.ProgressBar progressBarConectado;
        private System.Windows.Forms.Label label1;
        private RJCodeAdvance.RJControls.RJComboBox comboBoxPortas;
    }
}