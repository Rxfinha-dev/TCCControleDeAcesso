namespace TCCControleDeAcesso.Views
{
    partial class frmAtivacaoConta
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
            this.txtAtivacao = new System.Windows.Forms.TextBox();
            this.lblConfirmacao = new System.Windows.Forms.Label();
            this.btnAtivacao = new System.Windows.Forms.Button();
            this.textBox1 = new System.Windows.Forms.TextBox();
            this.label1 = new System.Windows.Forms.Label();
            this.label2 = new System.Windows.Forms.Label();
            this.btnEntrar = new System.Windows.Forms.Button();
            this.SuspendLayout();
            // 
            // txtAtivacao
            // 
            this.txtAtivacao.Location = new System.Drawing.Point(142, 173);
            this.txtAtivacao.Name = "txtAtivacao";
            this.txtAtivacao.Size = new System.Drawing.Size(209, 20);
            this.txtAtivacao.TabIndex = 9;
            // 
            // lblConfirmacao
            // 
            this.lblConfirmacao.AutoSize = true;
            this.lblConfirmacao.Font = new System.Drawing.Font("Arial", 11.25F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.lblConfirmacao.Location = new System.Drawing.Point(13, 153);
            this.lblConfirmacao.Name = "lblConfirmacao";
            this.lblConfirmacao.Size = new System.Drawing.Size(467, 17);
            this.lblConfirmacao.TabIndex = 8;
            this.lblConfirmacao.Text = "Insira aqui a senha que enviamos no seu email para ativação da conta:";
            // 
            // btnAtivacao
            // 
            this.btnAtivacao.BackColor = System.Drawing.SystemColors.ControlLightLight;
            this.btnAtivacao.FlatStyle = System.Windows.Forms.FlatStyle.Popup;
            this.btnAtivacao.Location = new System.Drawing.Point(209, 199);
            this.btnAtivacao.Name = "btnAtivacao";
            this.btnAtivacao.Size = new System.Drawing.Size(75, 25);
            this.btnAtivacao.TabIndex = 12;
            this.btnAtivacao.Text = "Ativar Conta";
            this.btnAtivacao.UseVisualStyleBackColor = false;
            this.btnAtivacao.Click += new System.EventHandler(this.btnAtivacao_Click);
            // 
            // textBox1
            // 
            this.textBox1.BorderStyle = System.Windows.Forms.BorderStyle.None;
            this.textBox1.Location = new System.Drawing.Point(196, 230);
            this.textBox1.Name = "textBox1";
            this.textBox1.Size = new System.Drawing.Size(100, 13);
            this.textBox1.TabIndex = 13;
            this.textBox1.Visible = false;
            // 
            // label1
            // 
            this.label1.AutoSize = true;
            this.label1.Location = new System.Drawing.Point(155, 268);
            this.label1.Name = "label1";
            this.label1.Size = new System.Drawing.Size(189, 14);
            this.label1.TabIndex = 15;
            this.label1.Text = "Problemas para receber o seu Email? ";
            // 
            // label2
            // 
            this.label2.AutoSize = true;
            this.label2.Location = new System.Drawing.Point(174, 282);
            this.label2.Name = "label2";
            this.label2.Size = new System.Drawing.Size(125, 14);
            this.label2.TabIndex = 16;
            this.label2.Text = "Tente digita-lo noamente!";
            // 
            // btnEntrar
            // 
            this.btnEntrar.BackColor = System.Drawing.SystemColors.ControlLightLight;
            this.btnEntrar.FlatStyle = System.Windows.Forms.FlatStyle.Popup;
            this.btnEntrar.Font = new System.Drawing.Font("Arial", 8.25F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.btnEntrar.Location = new System.Drawing.Point(209, 299);
            this.btnEntrar.Name = "btnEntrar";
            this.btnEntrar.Size = new System.Drawing.Size(71, 28);
            this.btnEntrar.TabIndex = 41;
            this.btnEntrar.Text = "Voltar";
            this.btnEntrar.UseVisualStyleBackColor = false;
            this.btnEntrar.Click += new System.EventHandler(this.btnEntrar_Click);
            // 
            // frmAtivacaoConta
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 14F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(492, 396);
            this.Controls.Add(this.btnEntrar);
            this.Controls.Add(this.label2);
            this.Controls.Add(this.label1);
            this.Controls.Add(this.textBox1);
            this.Controls.Add(this.btnAtivacao);
            this.Controls.Add(this.txtAtivacao);
            this.Controls.Add(this.lblConfirmacao);
            this.Font = new System.Drawing.Font("Arial", 8.25F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.Name = "frmAtivacaoConta";
            this.Text = "frmAtivacaoConta";
            this.Load += new System.EventHandler(this.frmAtivacaoConta_Load);
            this.ResumeLayout(false);
            this.PerformLayout();

        }

        #endregion
        private System.Windows.Forms.TextBox txtAtivacao;
        private System.Windows.Forms.Label lblConfirmacao;
        private System.Windows.Forms.Button btnAtivacao;
        private System.Windows.Forms.TextBox textBox1;
        private System.Windows.Forms.Label label1;
        private System.Windows.Forms.Label label2;
        private System.Windows.Forms.Button btnEntrar;
    }
}